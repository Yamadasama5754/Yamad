import { CommandHandler } from "../handler/handlers.js";
import { threadsController, usersController, economyControllers, expControllers } from "../database/controllers/index.js";
import { utils } from "../helper/index.js";
import fs from "fs";
import path from "path";
import config from "../KaguyaSetUp/config.js";

import { checkDevOnly } from "../commands/utility/devonly.js";
import { checkBadWords } from "../commands/utility/badwords.js";
import { autoPreventsKickedUsers } from "./auto-prevent-kicked-user.js";

const adminConfigPath = "KaguyaSetUp/adminOnlyMode.json";
const prefixFile = path.join(process.cwd(), "KaguyaSetUp/prefixes.json");

const developerIDs = Array.isArray(config.ADMIN_IDS) ? config.ADMIN_IDS : [];

// نظام التأخير والإعادة لتجنب Rate Limiting
const messageQueue = [];
let isProcessingQueue = false;
const RATE_LIMIT_DELAY = 800; // تأخير 800 ميلي ثانية بين الرسائل

async function sendMessageWithRetry(api, body, threadID, attempts = 0) {
  if (attempts > 2) {
    console.error("❌ فشل الإرسال بعد 3 محاولات");
    return null;
  }
  
  try {
    const result = await api.sendMessage(body, threadID);
    return result;
  } catch (err) {
    if (err.error === 1390008 || err.message?.includes("Rate")) {
      // تقييد من Facebook - انتظر وحاول مرة أخرى
      await new Promise(resolve => setTimeout(resolve, 2000 + (attempts * 1000)));
      return sendMessageWithRetry(api, body, threadID, attempts + 1);
    }
    throw err;
  }
}

function getPrefix(threadID, isGroup) {
  // في الرسائل الخاصة، البادئة افتراضياً فارغة (بدون بادئة)
  if (!isGroup) return "";
  
  if (!fs.existsSync(prefixFile)) return ".";
  const prefixes = JSON.parse(fs.readFileSync(prefixFile, "utf8"));
  return prefixes[threadID] !== undefined ? prefixes[threadID] : ".";
}

function parseCommand(body, threadID, isGroup) {
  const prefix = getPrefix(threadID, isGroup);
  if (!body || typeof body !== "string") return null;
  
  // إذا كانت البادئة فارغة (خاص بدون بادئة)، اعتبر أي رسالة أمر
  if (prefix === "") {
    const tokens = body.trim().split(/\s+/);
    if (!tokens.length) return null;
    const name = tokens[0];
    const args = tokens.slice(1);
    return { name, args };
  }
  
  if (!body.startsWith(prefix)) return null;

  const afterPrefix = body.slice(prefix.length).trim();
  if (!afterPrefix) return null;

  const tokens = afterPrefix.split(/\s+/);
  const name = tokens[0];
  const args = tokens.slice(1);

  return { name, args };
}

const createHandler = (api, event, User, Thread, Economy, Exp) => {
  const args = { api, event, Users: User, Threads: Thread, Economy, Exp };
  return new CommandHandler(args);
};

export const listen = async ({ api, event }) => {
  try {
    const { threadID, senderID, type, userID, from, isGroup, body } = event;

    // تجاهل رسائل البوت نفسه
    if (senderID === api.getCurrentUserID()) return;

    const Thread = threadsController({ api });
    const User = usersController({ api });
    const Economy = economyControllers({ api, event });
    const Exp = expControllers({ api, event });

    // إنشاء المستخدم/المجموعة في قاعدة البيانات
    if (["message", "message_reply", "message_reaction", "typ"].includes(type)) {
      if (isGroup) await Thread.create(threadID);
      await User.create(senderID || userID || from);
    }

    global.kaguya = utils({ api, event });
    const handler = createHandler(api, event, User, Thread, Economy, Exp);

    const developerID = "100092990751389";
    const isDeveloper = developerIDs.includes(senderID);

    // ✅ فحص ما إذا كان البوت معطلاً في المجموعة (قبل كل شيء)
    let isBotDisabled = false;
    if (type === "message" && isGroup) {
      const threadData = await Thread.find(threadID);
      isBotDisabled = threadData?.data?.botDisabled === true;
      
      if (isBotDisabled && senderID !== developerID) {
        // البوت معطل ولا يمكن الرد إلا على المطور
        return;
      }
    }

    // ✅ قراءة إعدادات admin only ديناميكياً قبل جميع الحالات
    let adminConfigData = {};
    if (fs.existsSync(adminConfigPath)) {
      adminConfigData = JSON.parse(fs.readFileSync(adminConfigPath, "utf8"));
    }
    const adminOnly = adminConfigData[threadID]?.adminOnly || false;

    // ✅ تشغيل الأحداث من eventFunctions (دوال فقط) - فقط إذا لم يكن البوت معطل أو الشخص مطور
    if (global.client.eventFunctions && type === "message") {
      if (!isBotDisabled || senderID === developerID) {
        global.client.eventFunctions.forEach((fn, name) => {
          try {
            fn({ api, event, Users: User, Threads: Thread, Economy, Exp });
          } catch (err) {
            console.error(`❌ خطأ أثناء تنفيذ حدث ${name}:`, err.message);
          }
        });
      }
    }

    switch (type) {
      case "people_added": {
        // منع إضافة الأعضاء الذين تم طردهم بسبب تحذيرات
        await autoPreventsKickedUsers({ api, event });
        break;
      }

      case "message": {
        // تجاهل الرسائل الفارغة
        if (!body || body.trim().length === 0) return;
        
        await checkBadWords(api, event);

        const parsed = parseCommand(body, threadID, isGroup);
        if (!parsed) return;

        let { name: commandName, args } = parsed;
        let exists = false;
        let finalCommandName = commandName;

        // البحث عن الأمر مع اعتبار جميع أسماء الأوامر
        if (global.client.commands.has(commandName)) {
          exists = true;
        } else if (global.client.aliases.has(commandName)) {
          finalCommandName = global.client.aliases.get(commandName);
          exists = true;
        } else {
          // محاولة مساعدة الأوامر العربية
          for (const [key] of global.client.commands) {
            if (key.toLowerCase() === commandName.toLowerCase()) {
              finalCommandName = key;
              exists = true;
              break;
            }
          }
        }

        if (!checkDevOnly(senderID) && exists) {
          return api.sendMessage("⚠️ | البوت حالياً في وضع المطور فقط.", threadID);
        }

        if (adminOnly && !isDeveloper && exists) {
          const threadInfo = await api.getThreadInfo(threadID);
          const isAdmin = threadInfo.adminIDs.some(admin => admin.id === senderID);
          if (!isAdmin) {
            return api.sendMessage("⚠️ | البوت حالياً في وضع الأدمن فقط.", threadID);
          }
        }

        if (exists) {
          event.commandName = finalCommandName;
          event.args = args;
          return handler.handleCommand();
        }

        // إذا كانت البادئة فارغة في مجموعة، تجاهل الرسالة ولا ترسل رسالة خطأ
        const prefix = getPrefix(threadID, isGroup);
        if (prefix === "" && isGroup) {
          return;
        }

        return api.sendMessage(
          `❌ | الأمر "${commandName}" غير موجود.\n` +
          `📜 | تحقق من الأوامر المتاحة بكتابة: ${getPrefix(threadID)}اوامر`,
          threadID
        );
      }

      case "message_reply": {
        const replyData = global.client.handler.reply.get(event.messageReply.messageID);

        if (replyData) {
          const command = global.client.commands.get(replyData.name);
          if (!command || typeof command.onReply !== "function") {
            global.client.handler.reply.delete(event.messageReply.messageID);
            console.log(`[Reply] تم حذف رد غير صالح: ${replyData.name}`);
            return api.sendMessage("⚠️ | هذا الرد لم يعد مرتبط بأي أمر نشط.", threadID);
          }

          try {
            await command.onReply({
              api,
              event,
              reply: replyData,
              Users: User,
              Threads: Thread,
              Economy,
              Exp
            });

            global.client.handler.reply.delete(event.messageReply.messageID);
            console.log(`[Reply] ${replyData.name} triggered by ${event.senderID}`);
          } catch (err) {
            console.error(`❌ خطأ في onReply لأمر "${replyData.name}":`, err);
            api.sendMessage("⚠️ | حدث خطأ أثناء تنفيذ الرد.", threadID);
          }

          return;
        }

        const parsed = parseCommand(body, threadID, isGroup);
        if (parsed) {
          let { name: commandName, args } = parsed;
          let exists = false;
          let finalCommandName = commandName;

          if (global.client.commands.has(commandName)) {
            exists = true;
          } else if (global.client.aliases.has(commandName)) {
            finalCommandName = global.client.aliases.get(commandName);
            exists = true;
          } else {
            // محاولة مساعدة الأوامر العربية
            for (const [key] of global.client.commands) {
              if (key.toLowerCase() === commandName.toLowerCase()) {
                finalCommandName = key;
                exists = true;
                break;
              }
            }
          }

          if (!checkDevOnly(senderID) && exists) {
            return api.sendMessage("⚠️ | البوت حالياً في وضع المطور فقط.", threadID);
          }

          if (adminOnly && !isDeveloper && exists) {
            const threadInfo = await api.getThreadInfo(threadID);
            const isAdmin = threadInfo.adminIDs.some(admin => admin.id === senderID);
            if (!isAdmin) {
              return api.sendMessage("⚠️ | البوت حالياً في وضع الأدمن فقط.", threadID);
            }
          }

          if (exists) {
            event.commandName = finalCommandName;
            event.args = args;
            return handler.handleCommand();
          }

          // إذا كانت البادئة فارغة في مجموعة، تجاهل الرسالة ولا ترسل رسالة خطأ
          const prefixCheck = getPrefix(threadID, isGroup);
          if (prefixCheck === "" && isGroup) {
            return;
          }
        }
        break;
      }

      case "message_reaction":
        await handler.handleReaction();
        break;

      default:
        break;
    }
  } catch (error) {
    console.error("❌ خطأ أثناء معالجة الحدث:", error);
    if (event?.threadID) {
      api.sendMessage("⚠️ | حدث خطأ غير متوقع أثناء معالجة الرسالة.", event.threadID);
    }
  }
};