import { log } from "../logger/index.js";
import fs from "fs-extra";
import axios from "axios";
import path from "path";
import config from "../KaguyaSetUp/config.js";

const warnsFile = path.join(process.cwd(), "database/warns.json");
const bansFile = path.join(process.cwd(), "database/bans.json");

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

const getBans = (threadID) => {
  try {
    const data = fs.readJsonSync(bansFile);
    return data[threadID] || [];
  } catch {
    return [];
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
          try {
            const threadInfo = await api.getThreadInfo(event.threadID);
            const threadName = threadInfo.threadName || "Unknown";
            const membersCount = threadInfo.participantIDs?.length || 0;
            const removedBy = event.author;
            
            // إرسال رسالة للمطور في الخاص
            const devMessage = [
              "═══════════════════════════",
              "🚫 تم طرد البوت من مجموعة 🚫",
              "═══════════════════════════",
              `📍 اسم المجموعة: ${threadName}`,
              `🔢 معرف المجموعة: ${event.threadID}`,
              `👥 عدد الأعضاء: ${membersCount}`,
              `🚨 تم الطرد بواسطة: ${removedBy}`,
              `⏰ الوقت: ${new Date().toLocaleString('ar-EG', { timeZone: 'Africa/Cairo' })}`,
              "═══════════════════════════"
            ].join("\n");

            try {
              await api.sendMessage(devMessage, "100092990751389");
            } catch (e) {
              console.warn("⚠️ خطأ في إرسال رسالة الطرد للمطور:", e.message);
            }
          } catch (err) {
            console.error("❌ خطأ في معالجة طرد البوت:", err.message);
          }

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
          const addedBy = event.author;
          
          // التحقق من أن الشخص الذي أضاف البوت هو مطور مصرح
          const isDeveloper = config.ADMIN_IDS.includes(addedBy);
          
          if (!isDeveloper) {
            // إذا لم يكن مطوراً، طرد البوت من المجموعة
            try {
              const threadInfo = await api.getThreadInfo(event.threadID);
              const threadName = threadInfo.threadName || "Unknown";
              const membersCount = threadInfo.participantIDs?.length || 0;
              
              // إرسال إشعار للمطور عن محاولة إضافة غير مصرحة
              const devMessage = [
                "═══════════════════════════",
                "⚠️ محاولة إضافة غير مصرحة ⚠️",
                "═══════════════════════════",
                `📍 اسم المجموعة: ${threadName}`,
                `🔢 معرف المجموعة: ${event.threadID}`,
                `👥 عدد الأعضاء: ${membersCount}`,
                `🚨 حاول الإضافة: ${addedBy}`,
                `⏰ الوقت: ${new Date().toLocaleString('ar-EG', { timeZone: 'Africa/Cairo' })}`,
                "═══════════════════════════",
                "✋ تم طرد البوت من المجموعة"
              ].join("\n");

              try {
                await api.sendMessage(devMessage, config.ADMIN_IDS[0]);
              } catch (e) {
                console.warn("⚠️ خطأ في إرسال رسالة الإضافة غير المصرحة:", e.message);
              }

              // إرسال رسالة في المجموعة
              await api.sendMessage(
                "⚠️ | آسف! البوت مقيد ويمكن إضافته فقط من المطورين المصرحين.",
                event.threadID
              );

              // طرد البوت من المجموعة
              await api.removeUserFromGroup(api.getCurrentUserID(), event.threadID);
              
              console.warn(`⚠️ تم رفض إضافة البوت من قبل مستخدم غير مصرح: ${addedBy} في المجموعة ${event.threadID}`);
            } catch (err) {
              console.error("❌ خطأ في معالجة رفض إضافة البوت:", err.message);
            }
            return;
          }
          
          // إذا كان المضيف مطوراً، قبول الإضافة
          try {
            const threadInfo = await api.getThreadInfo(event.threadID);
            const threadName = threadInfo.threadName || "Unknown";
            const membersCount = threadInfo.participantIDs?.length || 0;
            
            // إرسال رسالة للمطور في الخاص
            const devMessage = [
              "═══════════════════════════",
              "✅ تمت إضافة البوت إلى مجموعة جديدة ✅",
              "═══════════════════════════",
              `📍 اسم المجموعة: ${threadName}`,
              `🔢 معرف المجموعة: ${event.threadID}`,
              `👥 عدد الأعضاء: ${membersCount}`,
              `👤 تمت الإضافة بواسطة: ${addedBy}`,
              `⏰ الوقت: ${new Date().toLocaleString('ar-EG', { timeZone: 'Africa/Cairo' })}`,
              "═══════════════════════════"
            ].join("\n");

            try {
              await api.sendMessage(devMessage, config.ADMIN_IDS[0]);
            } catch (e) {
              console.warn("⚠️ خطأ في إرسال رسالة الإضافة للمطور:", e.message);
            }
          } catch (err) {
            console.error("❌ خطأ في معالجة إضافة البوت:", err.message);
          }

          // حذف رسالة التوصيل
          try {
            if (event.messageID) {
              api.unsendMessage(event.messageID);
            }
          } catch (e) {
            console.warn("⚠️ لم نتمكن من حذف رسالة التوصيل:", e.message);
          }

          // تأخير بسيط لضمان جاهزية البوت
          await new Promise(resolve => setTimeout(resolve, 1000));

          // تغيير اسم البوت عند إضافته إلى المجموعة
          const botName = "Mirai";
          try {
            api.changeNickname(
              `【 ${botName} 】`,
              event.threadID,
              api.getCurrentUserID()
            );
          } catch (e) {
            console.warn("⚠️ لم نتمكن من تغيير الاسم:", e.message);
          }

          // رسالة الترحيب عند إضافة البوت - مبسطة وبدون أحرف خاصة معقدة
          const welcomeMessage = `✅ تم التوصيل بنجاح!\n\n━━━━━━━━━━━━━━━━\n🤖 اسم البوت: ${botName}\n📍 رمز البادئة: .\n👑 المالك: Yamada\n━━━━━━━━━━━━━━━━\n\n📝 كيفية الاستخدام:\n• اكتب .اوامر لعرض جميع الأوامر\n• اكتب .مساعدة لعرض المساعدة\n• اكتب .تقرير لإرسال تقرير\n\n🔗 رابط المطور:\nhttps://www.facebook.com/profile.php?id=100092990751389`;

          try {
            await api.sendMessage(welcomeMessage, event.threadID);
            console.log("✅ تم إرسال رسالة الترحيب بنجاح للمجموعة:", event.threadID);
          } catch (e) {
            console.error("❌ خطأ في إرسال رسالة الترحيب:", e.message);
            // محاولة إرسال رسالة بديلة مبسطة
            try {
              await api.sendMessage(`✅ البوت جاهز! اكتب .اوامر لعرض الأوامر`, event.threadID);
            } catch (e2) {
              console.error("❌ فشل إرسال الرسالة البديلة أيضاً:", e2.message);
            }
          }
        } else {
          // إذا تم إضافة أعضاء آخرين، فقط تحديث عدد الأعضاء بدون رسائل
          for (let i of event.logMessageData.addedParticipants) {
            const addedUserID = i.userFbId;
            await Users.create(addedUserID);

            // 🚫 التحقق من قائمة الحظر أولاً
            const bans = getBans(event.threadID);
            const bannedUser = bans.find(b => b.userID === addedUserID);
            
            if (bannedUser) {
              try {
                const botID = api.getCurrentUserID();
                const threadInfo = await api.getThreadInfo(event.threadID);
                const isBotAdmin = threadInfo.adminIDs?.some(admin => admin.id === botID);

                if (isBotAdmin) {
                  // البوت أدمن: طرد الشخص المحظور تلقائياً
                  await api.removeUserFromGroup(addedUserID, event.threadID);
                  api.sendMessage(
                    `🚫 | تم طرد هذا الشخص تلقائياً!\n📌 السبب: الشخص محظور من المجموعة\n🔐 المعرف: ${addedUserID}`,
                    event.threadID
                  );
                  continue;
                } else {
                  // البوت ليس أدمن: رسالة تنبيه
                  api.sendMessage(
                    `⚠️ | تنبيه: شخص محظور عاد للمجموعة!\n👤 المعرف: ${addedUserID}\n🚨 البوت يجب أن يكون أدمن لطرده تلقائياً!`,
                    event.threadID
                  );
                }
              } catch (err) {
                console.error("❌ خطأ في معالجة الشخص المحظور:", err.message);
              }
            }

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
