import { log } from "../logger/index.js";
import fs from "fs-extra";
import axios from "axios";
import path from "path";
import config from "../KaguyaSetUp/config.js";

const warnsFile = path.join(process.cwd(), "database/warns.json");

const getWarns = (threadID) => {
  try {
    const data = fs.readJsonSync(warnsFile);
    return data[threadID] || {};
  } catch {
    return {};
  }
};

const saveWarns = (threadID, warns) => {
  try {
    const data = fs.readJsonSync(warnsFile);
    data[threadID] = warns;
    fs.writeFileSync(warnsFile, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("خطأ في حفظ التحذيرات:", err);
  }
};

export default {
  name: "subscribe",
  execute: async ({ api, event, Threads, Users }) => {
    // جلب بيانات المجموعة
    var threads = (await Threads.find(event.threadID))?.data?.data;

    // التحقق من وجود بيانات المجموعة
    if (!threads) {
      await Threads.create(event.threadID);
    }

    switch (event.logMessageType) {
      case "log:unsubscribe": {
        // إذا تم طرد البوت من المجموعة
        if (event.logMessageData.leftParticipantFbId == api.getCurrentUserID()) {
          await Threads.remove(event.threadID);
          
          return log([
            {
              message: "[ THREADS ]: ",
              color: "yellow",
            },
            {
              message: `تم حذف بيانات المجموعة مع المعرف: ${event.threadID} لأن البوت تم طرده.`,
              color: "green",
            },
          ]);
        }
        // تحديث عدد الأعضاء بعد خروج شخص
        await Threads.update(event.threadID, {
          members: +threads.members - 1,
        });
        break;
      }

      case "log:subscribe": {
        // إذا تمت إضافة البوت إلى المجموعة
        if (event.logMessageData.addedParticipants.some((i) => i.userFbId == api.getCurrentUserID())) {
          // حذف رسالة التوصيل
          try {
            api.unsendMessage(event.messageID);
          } catch (e) {}

          // تغيير اسم البوت عند إضافته إلى المجموعة
          const botName = "𝑴𝒊𝒓𝒂𝒊"; // اسم البوت
          try {
            api.changeNickname(
              `》 《 ❃ ➠ ${botName}`,
              event.threadID,
              api.getCurrentUserID()
            );
          } catch (e) {}

          // رسالة الترحيب عند إضافة البوت
          const welcomeMessage = `✅ | تــم الــتــوصــيــل بـنـجـاح\n❏ الـرمـز : 『بدون رمز』\n❏ إسـم الـبـوت : 『${botName}』\nالــمــالــك : 『Yamada』\n╼╾─────⊹⊱⊰⊹─────╼╾\n⚠️  |  اكتب قائمة او اوامر او تقرير في حالة واجهتك أي مشكلة\n╼╾─────⊹⊱⊰⊹─────╼╾\n ⪨༒𓊈𒆜 𝑴𝒊𝒓𝒂𝒊 𒆜𓊉༒⪩ \n╼╾─────⊹⊱⊰⊹─────╼╾\n❏ رابـط الـمـطـور : \nhttps://www.facebook.com/profile.php?id=100092990751389`;

          try {
            await api.sendMessage(welcomeMessage, event.threadID);
          } catch (e) {
            console.error("[SUBSCRIBE] Error sending welcome:", e.message);
          }
        } else {
          // إذا تم إضافة أعضاء آخرين، فقط تحديث عدد الأعضاء بدون رسائل
          for (let i of event.logMessageData.addedParticipants) {
            const addedUserID = i.userFbId;
            await Users.create(addedUserID);

            // 🚫 التحقق من التحذيرات: إذا كان العضو لديه 3 تحذيرات وتم طرده
            const warns = getWarns(event.threadID);
            if (warns[addedUserID] && warns[addedUserID].kicked && warns[addedUserID].count >= 3) {
              const adderID = event.author; // معرف الشخص الذي أضاف العضو
              const isAdminOrDev = config.ADMIN_IDS.includes(adderID);

              if (isAdminOrDev) {
                // إذا أضافه أدمن أو مطور: حذف التحذيرات تلقائياً
                warns[addedUserID] = {
                  count: 0,
                  reasons: [],
                  warnedBy: [],
                  warnedAt: [],
                  kicked: false,
                  kickedDate: null
                };
                saveWarns(event.threadID, warns);

                try {
                  const userName = await Users.getNameUser(addedUserID);
                  api.sendMessage(
                    `✅ | تم حذف التحذيرات تلقائياً للعضو: ${userName}\n👤 الشخص الذي أضافه: أدمن/مطور`,
                    event.threadID
                  );
                } catch (err) {
                  console.error("خطأ في إرسال الرسالة:", err);
                }
              } else {
                // إذا أضافه عضو عادي: طرده مرة أخرى تلقائياً
                try {
                  const botID = api.getCurrentUserID();
                  const threadInfo = await api.getThreadInfo(event.threadID);
                  const isBotAdmin = threadInfo.adminIDs?.some(admin => admin.id === botID);

                  if (isBotAdmin) {
                    await api.removeUserFromGroup(addedUserID, event.threadID);
                    const userName = await Users.getNameUser(addedUserID);
                    api.sendMessage(
                      `🚫 | تم طرد العضو: ${userName}\n📌 السبب: كان لديه 3 تحذيرات سابقة`,
                      event.threadID
                    );
                  }
                } catch (err) {
                  console.error("خطأ في طرد العضو:", err);
                }
              }
            }
          }
          
          // تحديث عدد الأعضاء بعد إضافة أشخاص
          await Threads.update(event.threadID, {
            members: +threads.members + +event.logMessageData.addedParticipants.length,
          });
        }
        break;
      }
    }
  },
};
