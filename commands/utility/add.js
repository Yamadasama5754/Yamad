import config from "../../KaguyaSetUp/config.js";
import fs from "fs-extra";
import path from "path";

const bansFile = path.join(process.cwd(), "database/bans.json");

const getBans = (threadID) => {
  try {
    const data = fs.readJsonSync(bansFile);
    return data[threadID] || [];
  } catch {
    return [];
  }
};

class AddUser {
  constructor() {
    this.name = "ادخلني";
    this.author = "Yamada KJ & Alastor - Enhanced";
    this.cooldowns = 3;
    this.description = "إضافة عضو إلى المجموعة مع فحوصات ذكية | الاستخدام: ادخلني @منشن أو ادخلني [ID] أو رد على رسالة وقل ادخلني";
    this.role = 0; // ✅ متاح للجميع
    this.aliases = ["add", "join", "ادخل", "ادخلني"];
  }

  async execute({ api, event, args }) {
    try {
      const threadInfo = await api.getThreadInfo(event.threadID);

      // ✅ تحقق: هل هذا خاص أم مجموعة؟
      if (!threadInfo.isGroup) {
        return api.sendMessage(
          "⚠️ | هذا الأمر يشتغل فقط داخل المجموعات!",
          event.threadID,
          event.messageID
        );
      }

      // ✅ تحديد الشخص (ID أو رابط فيسبوك أو mention أو رد على رسالة)
      let targetID;
      let targetName = "العضو";

      // 1️⃣ لو الأمر جاء كرد على رسالة
      if (event.type === "message_reply" && event.messageReply) {
        targetID = event.messageReply.senderID;
      }
      // 2️⃣ لو فيه mention
      else if (Object.keys(event.mentions).length > 0) {
        const mentions = event.mentions;
        const firstMention = Object.keys(mentions)[0];
        targetID = firstMention;
        targetName = mentions[firstMention] || "العضو";
      }
      // 3️⃣ لو فيه ID أو رابط
      else if (args.length > 0) {
        targetID = args[0];

        // لو الرابط فيسبوك → حاول استخراج الـ ID
        if (targetID.includes("facebook.com")) {
          const match = targetID.match(/(?:facebook\.com\/)?(\d+)/);
          if (match) {
            targetID = match[1];
          } else {
            return api.sendMessage(
              "⚠️ | الرابط غير صحيح! تأكد من أنه يحتوي على ID رقمي.",
              event.threadID,
              event.messageID
            );
          }
        }
      }

      if (!targetID || !targetID.match(/^\d+$/)) {
        return api.sendMessage(
          "⚠️ | استخدم:\n• ادخلني @منشن\n• ادخلني [ID]\n• رد على رسالة وقل ادخلني\n• ادخلني [رابط فيسبوك]",
          event.threadID,
          event.messageID
        );
      }

      // ❌ منع إضافة البوت نفسه
      if (targetID === event.senderID) {
        return api.sendMessage(
          "😂 | ما أنت هون؟ حاول تدخل شخص تاني!",
          event.threadID,
          event.messageID
        );
      }

      // ✅ تحقق: هل الشخص مبان؟
      const bans = getBans(event.threadID);
      if (bans.find(b => b.userID === targetID)) {
        return api.sendMessage(
          `❌ | هذا الشخص مبان من المجموعة! 🚫 لا يمكن إضافته.`,
          event.threadID,
          event.messageID
        );
      }

      // ✅ تحقق: هل الشخص موجود بالفعل في المجموعة؟
      const alreadyInGroup = threadInfo.participantIDs.includes(targetID);
      if (alreadyInGroup) {
        return api.sendMessage(
          `ℹ️ | ${targetName || "هذا الشخص"} موجود بالفعل في المجموعة!`,
          event.threadID,
          event.messageID
        );
      }

      // 🔄 محاولة الإضافة مع معالجة أفضل للأخطاء
      api.addUserToGroup(targetID, event.threadID, (err) => {
        if (err) {
          let errorMsg = "❌ | فشل إضافة الشخص\n\n";
          const errorLower = (err.message || "").toLowerCase();
          
          // تحليل نوع الخطأ بشكل أفضل
          if (errorLower.includes("not admin") || errorLower.includes("not authorized") || errorLower.includes("permission") || errorLower.includes("admin")) {
            errorMsg = "⚠️ | البوت لازم يكون أدمن في المجموعة! 👑\nاطلب من مسؤول المجموعة يعطيه صلاحيات الأدمن.";
          } else if (errorLower.includes("already") || errorLower.includes("member")) {
            errorMsg = "ℹ️ | هذا الشخص موجود بالفعل في المجموعة!";
          } else if (errorLower.includes("blocked") || errorLower.includes("block")) {
            errorMsg = "🔍 | هذا الشخص قد حظرك أو حظر المجموعة! 🚫";
          } else if (errorLower.includes("not found") || errorLower.includes("invalid")) {
            errorMsg = "❌ | الـ ID غير صحيح أو هذا الحساب غير موجود!";
          } else if (errorLower.includes("deactivated")) {
            errorMsg = "⚠️ | هذا الحساب معطل أو محذوف!";
          } else {
            errorMsg += `🔍 ${err.message || "خطأ غير معروف"}`;
          }
          
          return api.sendMessage(errorMsg, event.threadID, event.messageID);
        }
        
        api.sendMessage(
          `✅ | تم إضافة ${targetName || "العضو"} بنجاح! 🎉\n${targetName ? `(${targetID})` : ""}`,
          event.threadID,
          event.messageID
        );
      });
    } catch (err) {
      console.error("❌ Error in add command:", err);
      return api.sendMessage(
        `⚠️ | حصل خطأ غير متوقع:\n${err.message}`,
        event.threadID,
        event.messageID
      );
    }
  }
}

export default new AddUser();