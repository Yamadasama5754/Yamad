import fs from "fs-extra";
import path from "path";

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

// منع إضافة الأعضاء الذين تم طردهم بسبب تحذيرات وحذف تحذيراتهم
export const autoPreventsKickedUsers = async ({ api, event }) => {
  try {
    const { threadID, addedParticipants } = event;

    if (!Array.isArray(addedParticipants) || addedParticipants.length === 0) {
      return;
    }

    const warns = getWarns(threadID);
    const botID = api.getCurrentUserID();

    // التحقق من كل عضو تم إضافته
    for (const participant of addedParticipants) {
      const userID = participant.userFbId || participant.id;

      // إذا كان الشخص قد تم طرده من قبل بسبب تحذيرات
      if (warns[userID] && warns[userID].kicked) {
        try {
          // حذف التحذيرات الخاصة به
          delete warns[userID];
          saveWarns(threadID, warns);
          
          // طرد الشخص
          await api.removeUserFromGroup(userID, threadID);
          
          console.log(`✅ تم طرد ${userID} تلقائياً - كان محظوراً بسبب تحذيرات`);
          console.log(`✅ تم حذف جميع التحذيرات الخاصة به`);
        } catch (err) {
          console.error(`❌ فشل في طرد ${userID}:`, err.message);
        }
      }
    }
  } catch (err) {
    console.error("❌ خطأ في auto-prevent-kicked-users:", err);
  }
};

export default autoPreventsKickedUsers;
