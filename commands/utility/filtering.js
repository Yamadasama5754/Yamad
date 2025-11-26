import config from "../../KaguyaSetUp/config.js";

const developerID = "100092990751389";

class PurgeCommand {
  constructor() {
    this.name = "تصفية";
    this.author = "Yamada KJ & Alastor";
    this.cooldowns = 300;
    this.description = "يصفي الحسابات المتبنده من المجموعه أو عرض قائمة الأوامر";
    this.role = 1;
    this.aliases = ["تصفية", "purge"];
  }

  async execute({ api, event }) {
    try {
      api.setMessageReaction("⏳", event.messageID, (err) => {}, true);

      const threadInfo = await api.getThreadInfo(event.threadID);
      const { userInfo, adminIDs } = threadInfo;
      
      // التحقق من أن البوت أدمن قبل أي شيء
      const botID = api.getCurrentUserID();
      const isBotAdmin = adminIDs.some(admin => admin.id === botID);

      if (!isBotAdmin) {
        api.setMessageReaction("❌", event.messageID, (err) => {}, true);
        return api.sendMessage("❌ | البوت يجب أن يكون أدمن لاستخدام هذا الأمر. ارفعني ادمن وهشتغل لوحدي! 🙏", event.threadID);
      }

      // البحث عن الحسابات المتبنده (التي ليس لها gender)
      let success = 0, fail = 0;
      const ghostAccounts = [];

      for (const user of userInfo) {
        if (user.gender === undefined) {
          ghostAccounts.push(user.id);
        }
      }

      // التحقق من وجود حسابات للتصفية
      if (ghostAccounts.length === 0) {
        api.setMessageReaction("✅", event.messageID, (err) => {}, true);
        return api.sendMessage("✅ | مافي حسابات طايرة بالمجموعة. المجموعة نظيفة! 🎉", event.threadID);
      }

      // بدء التصفية
      api.sendMessage(
        `📊 | وجدت ${ghostAccounts.length} حساب طائر بالجروب.\n⏳ جاري التصفية...`,
        event.threadID,
        async (err, info) => {
          if (err) return;

          // تصفية الحسابات
          for (const userID of ghostAccounts) {
            // 🚫 منع طرد البوت والمطورين من التصفية (إلا المطور الحالي يقدر يطرد البوت)
            if (userID === botID && event.senderID !== developerID) {
              console.log(`[FILTERING] تم استثناء البوت من التصفية (محمي).`);
              continue;
            }
            if (userID !== botID && config.ADMIN_IDS.includes(userID)) {
              console.log(`[FILTERING] تم استثناء ${userID} من التصفية (مطور).`);
              continue;
            }

            try {
              await new Promise(resolve => setTimeout(resolve, 1000));
              await api.removeUserFromGroup(parseInt(userID), event.threadID);
              success++;
            } catch (error) {
              console.error(`فشل في طرد ${userID}:`, error);
              fail++;
            }
          }

          // إرسال النتيجة
          let resultMsg = `✨ | تمت التصفية بنجاح!\n\n`;
          resultMsg += `✅ تم طرد ${success} حساب طائر\n`;
          if (fail > 0) {
            resultMsg += `⚠️ فشل طرد ${fail} حساب\n`;
          }
          resultMsg += `\n🎯 المجموعة الآن أنظف! 🧹`;

          api.sendMessage(resultMsg, event.threadID);
          api.unsendMessage(info.messageID);
          api.setMessageReaction("✅", event.messageID, (err) => {}, true);
        }
      );
    } catch (err) {
      api.setMessageReaction("❌", event.messageID, (err) => {}, true);
      api.sendMessage(`❌ | حدث خطأ: ${err.message}`, event.threadID);
    }
  }
}

export default new PurgeCommand();
