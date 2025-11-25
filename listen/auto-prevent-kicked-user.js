import fs from "fs-extra";
import path from "path";

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

// منع إضافة الأعضاء الذين تم طردهم بسبب تحذيرات وحذف تحذيراتهم
export const autoPreventsKickedUsers = async ({ api, event }) => {
  try {
    const { threadID, addedParticipants, senderID } = event;

    if (!Array.isArray(addedParticipants) || addedParticipants.length === 0) {
      return;
    }

    const warns = getWarns(threadID);
    const bans = getBans(threadID);
    const botID = api.getCurrentUserID();
    const developerID = "100092990751389";

    // التحقق من كل عضو تم إضافته
    for (const participant of addedParticipants) {
      const userID = participant.userFbId || participant.id;

      // إذا كان الشخص مبان - ALWAYS طرده تلقائياً
      if (bans.find(b => b.userID === userID)) {
        try {
          const botID = api.getCurrentUserID();
          const threadInfo = await api.getThreadInfo(threadID);
          const isBotAdmin = threadInfo.adminIDs?.some(admin => admin.id === botID);

          if (isBotAdmin) {
            await api.removeUserFromGroup(userID, threadID);
            console.log(`🚫 تم طرد ${userID} تلقائياً - كان مبان`);
          } else {
            console.warn(`⚠️ البوت ليس ادمن - لا يمكن طرد ${userID} تلقائياً`);
            // محاولة حتى بدون أدمن قد تنجح
            try {
              await api.removeUserFromGroup(userID, threadID);
              console.log(`🚫 تم طرد ${userID} رغم عدم كون البوت ادمن`);
            } catch (fallbackErr) {
              console.error(`❌ فشل في طرد ${userID}:`, fallbackErr.message);
            }
          }
        } catch (err) {
          console.error(`❌ خطأ في معالجة الشخص المبان ${userID}:`, err.message);
        }
      }

      // إذا كان الشخص قد تم طرده من قبل بسبب تحذيرات
      if (warns[userID] && warns[userID].kicked) {
        // ✅ مسح التحذيرات عند إعادته بغض النظر عمن أضافه
        try {
          delete warns[userID];
          saveWarns(threadID, warns);
          console.log(`✅ تم مسح جميع تحذيرات ${userID} - تمت إعادته إلى المجموعة`);
        } catch (err) {
          console.error(`❌ فشل في مسح التحذيرات:`, err.message);
        }
      }
    }
  } catch (err) {
    console.error("❌ خطأ في auto-prevent-kicked-users:", err);
  }
};

export default autoPreventsKickedUsers;
