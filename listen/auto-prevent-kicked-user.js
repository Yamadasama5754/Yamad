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

      // إذا كان الشخص مبان
      if (bans.find(b => b.userID === userID)) {
        try {
          await api.removeUserFromGroup(userID, threadID);
          console.log(`🚫 تم طرد ${userID} تلقائياً - كان مبان`);
        } catch (err) {
          console.error(`❌ فشل في طرد ${userID}:`, err.message);
        }
      }

      // إذا كان الشخص قد تم طرده من قبل بسبب تحذيرات
      if (warns[userID] && warns[userID].kicked) {
        // ✅ إذا أضافه المطور أو أدمن، امسح تحذيراته (يدخل المجموعة)
        if (senderID === developerID || senderID === addedParticipants[0]?.id) {
          try {
            delete warns[userID];
            saveWarns(threadID, warns);
            console.log(`✅ تم مسح جميع تحذيرات ${userID} - تمت استدعاؤه من قبل مطور/أدمن`);
          } catch (err) {
            console.error(`❌ فشل في مسح التحذيرات:`, err.message);
          }
        } else {
          // ❌ إذا لم يكن مطور/أدمن، طرد الشخص تلقائياً
          try {
            delete warns[userID];
            saveWarns(threadID, warns);
            
            await api.removeUserFromGroup(userID, threadID);
            
            console.log(`✅ تم طرد ${userID} تلقائياً - كان محظوراً بسبب تحذيرات`);
            console.log(`✅ تم حذف جميع التحذيرات الخاصة به`);
          } catch (err) {
            console.error(`❌ فشل في طرد ${userID}:`, err.message);
          }
        }
      }
    }
  } catch (err) {
    console.error("❌ خطأ في auto-prevent-kicked-users:", err);
  }
};

export default autoPreventsKickedUsers;
