import { CommandHandler } from "../handler/handlers.js";
import { threadsController, usersController, economyControllers, expControllers } from "../database/controllers/index.js";
import { utils } from "../helper/index.js";
import fs from "fs";
import path from "path";
import config from "../KaguyaSetUp/config.js";

import { checkDevOnly, isDevOnlyBlocked, areNotificationsEnabled as areDevNotificationsEnabled } from "../commands/utility/devonly.js";
import { isAdminOnlyBlocked, areNotificationsEnabled as areAdminNotificationsEnabled } from "../commands/utility/admin_only.js";
import { checkBadWords } from "../commands/utility/badwords.js";
import { autoPreventsKickedUsers } from "./auto-prevent-kicked-user.js";

const prefixFile = path.join(process.cwd(), "KaguyaSetUp/prefixes.json");

const developerIDs = Array.isArray(config.ADMIN_IDS) ? config.ADMIN_IDS : [];

// نظام التأخير والإعادة لتجنب Rate Limiting
const messageQueue = [];
let isProcessingQueue = false;
const RATE_LIMIT_DELAY = 100; // تأخير 100 ميلي ثانية فقط للسرعة

// نظام caching بسيط للبيانات المتكررة
const dataCache = new Map();
const CACHE_TTL = 10000; // 10 ثواني

function getCachedData(key) {
  const cached = dataCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

function setCachedData(key, data) {
  dataCache.set(key, { data, timestamp: Date.now() });
}

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
  // في الرسائل الخاصة، البادئة دائماً "." ولا يمكن تغييرها
  if (!isGroup) return ".";
  
  if (!fs.existsSync(prefixFile)) return ".";
  const prefixes = JSON.parse(fs.readFileSync(prefixFile, "utf8"));
  return prefixes[threadID] !== undefined ? prefixes[threadID] : ".";
}

function parseCommand(body, threadID, isGroup) {
  const prefix = getPrefix(threadID, isGroup);
  if (!body || typeof body !== "string") return null;
  
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

    // إنشاء المستخدم/المجموعة في قاعدة البيانات بشكل متوازي (أسرع)
    if (["message", "message_reply", "message_reaction", "typ"].includes(type)) {
      const promises = [];
      if (isGroup) promises.push(Thread.create(threadID));
      promises.push(User.create(senderID || userID || from));
      if (promises.length > 0) await Promise.all(promises);
    }

    global.kaguya = utils({ api, event });
    const handler = createHandler(api, event, User, Thread, Economy, Exp);

    const developerIDs = ["100092990751389", "61578918847847"];
    const isDeveloper = developerIDs.includes(senderID);
    
    // الحصول على قائمة الأدمن للمجموعة
    let adminList = [];
    if (isGroup) {
      try {
        const threadInfo = await api.getThreadInfo(threadID);
        adminList = threadInfo.adminIDs || [];
      } catch (err) {
        console.error('خطأ في الحصول على معلومات المجموعة:', err.message);
      }
    }
    
    // 🔒 فحص وضع المطور فقط والإدمن فقط - لكن اسمح لأوامر التحكم نفسها بالمتابعة
    const isBlockedByDevOnly = isDevOnlyBlocked(senderID);
    const isBlockedByAdminOnly = isGroup && isAdminOnlyBlocked(senderID, threadID, adminList);
    
    // إذا كان مكتومة، تحقق من الأمر - هل هو أمر التحكم نفسه؟
    if ((isBlockedByDevOnly || isBlockedByAdminOnly) && type === "message") {
      const parsed = parseCommand(body, threadID, isGroup);
      const isControlCommand = parsed && (parsed.name === "المطور_فقط" || parsed.name === "ادمن_فقط" || parsed.name === "الادمن_فقط");
      
      // إذا لم يكن أمر تحكم، طبق الحجب الصامت
      if (!isControlCommand) {
        return; // الصمت التام - لا أحداث، لا أوامر
      }
    }

    // ✅ تشغيل جميع الأحداث العامة (mirai, ميراي, وغيرها)
    await handler.handleEvent();

    // ✅ فحص ما إذا كان البوت معطلاً في المجموعة (قبل كل شيء) مع caching
    let isBotDisabled = false;
    if (type === "message" && isGroup) {
      let threadData = getCachedData(`thread_${threadID}`);
      if (!threadData) {
        threadData = await Thread.find(threadID);
        setCachedData(`thread_${threadID}`, threadData);
      }
      isBotDisabled = threadData?.data?.botDisabled === true;
      
      if (isBotDisabled && senderID !== developerID) {
        return;
      }
    }


    switch (type) {
      case "log:subscribe":
      case "log:unsubscribe": {
        // ✅ معالجة أحداث اللوغ (الترحيب والمغادرة)
        const eventsToCall = ["subscribe", "ترحيب", "ترحيب_ومغادرة"];
        
        for (const eventName of eventsToCall) {
          const event_obj = global.client.events.get(eventName);
          if (event_obj && event_obj.execute) {
            try {
              await event_obj.execute({ api, event, Users: User, Threads: Thread, Economy, Exp });
            } catch (err) {
              console.error(`❌ خطأ في حدث ${eventName}:`, err.message);
            }
          }
        }
        break;
      }

      case "people_added": {
        // منع إضافة الأعضاء الذين تم طردهم بسبب تحذيرات
        await autoPreventsKickedUsers({ api, event });
        break;
      }

      case "message": {
        // تجاهل الرسائل الفارغة
        if (!body || body.trim().length === 0) return;
        
        // تشغيل الأحداث العامة للرسائل - فقط أحداث الرسائل العادية
        if (global.client.eventFunctions && (!isBotDisabled || senderID === developerID)) {
          const messageEvents = ["mirai", "ميراي"];
          await Promise.all(Array.from(global.client.eventFunctions.entries())
            .filter(([name]) => messageEvents.includes(name))
            .map(([name, fn]) => {
              try {
                return Promise.resolve(fn({ api, event, Users: User, Threads: Thread, Economy, Exp }));
              } catch (err) {
                console.error(`❌ خطأ أثناء تنفيذ حدث ${name}:`, err.message);
              }
            })).catch((err) => {
              console.error(`❌ خطأ في الأحداث:`, err.message);
            });
        }
        
        await checkBadWords(api, event);

        const prefix = getPrefix(threadID, isGroup);
        
        // فحص إذا كانت الرسالة تبدأ بالبادئة
        if (!body.startsWith(prefix)) return;
        
        // فحص إذا كانت الرسالة "البادئة فقط" بدون أمر
        const afterPrefix = body.slice(prefix.length).trim();
        if (!afterPrefix) {
          // في الخاص: ترسل رسالة
          if (!isGroup) {
            return api.sendMessage(
              `💡 أرسل أمر بعد البادئة "."\n\n📜 مثال: .اوامر`,
              threadID
            );
          }
          return;
        }

        const tokens = afterPrefix.split(/\s+/);
        const commandName = tokens[0];
        const args = tokens.slice(1);

        let exists = false;
        let finalCommandName = commandName;

        // البحث عن الأمر - محاولة متعددة المستويات
        // 1️⃣ البحث الدقيق (حرف بحرف)
        if (global.client.commands.has(commandName)) {
          exists = true;
        }
        // 2️⃣ البحث في الأسماء المستعارة (Aliases)
        else if (global.client.aliases.has(commandName)) {
          finalCommandName = global.client.aliases.get(commandName);
          exists = true;
        }
        // 3️⃣ البحث بدون تمييز أحرف صغيرة/كبيرة
        else {
          for (const [key] of global.client.commands) {
            if (key.toLowerCase() === commandName.toLowerCase()) {
              finalCommandName = key;
              exists = true;
              break;
            }
          }
        }
        
        // إذا لم نجد - جرب الأسماء المستعارة بدون تمييز أحرف
        if (!exists) {
          for (const [aliasKey, cmdName] of global.client.aliases) {
            if (aliasKey.toLowerCase() === commandName.toLowerCase()) {
              finalCommandName = cmdName;
              exists = true;
              break;
            }
          }
        }

        if (exists) {
          event.commandName = finalCommandName;
          event.args = args;
          return await handler.handleCommand();
        }

        // الأمر غير موجود - ترسل رسالة خطأ في كل مكان (خاص ومجموعات)
        return api.sendMessage(
          `❌ | الأمر "${commandName}" غير موجود.\n` +
          `📜 | تحقق من الأوامر المتاحة بكتابة: ${prefix}اوامر`,
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

            // حذف البيانات المرتبطة بـ TicTacToe بعد كل رد (اختياري)
            if (global.client.commands.get("اكس_او")) {
              const xoCmd = global.client.commands.get("اكس_او");
              if (xoCmd.gamesByMessage) {
                xoCmd.gamesByMessage.delete(event.messageReply.messageID);
              }
            }

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
            // تحقق من الإشعارات قبل إرسال الرسالة
            if (areDevNotificationsEnabled(threadID)) {
              return api.sendMessage("⚠️ | البوت حالياً في وضع المطور فقط.", threadID);
            }
            return; // صمت إذا كانت الإشعارات معطلة
          }


          if (exists) {
            event.commandName = finalCommandName;
            event.args = args;
            return await handler.handleCommand();
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