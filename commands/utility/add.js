import config from "../../KaguyaSetUp/config.js";

class AddUser {
  constructor() {
    this.name = "ادخل";
    this.author = "Yamada KJ & Alastor";
    this.cooldowns = 5;
    this.description = "إضافة عضو إلى المجموعة (متاح للجميع)";
    this.role = 0; // ✅ متاح للجميع
    this.aliases = ["add", "join"];
  }

  async execute({ api, event, args }) {
    try {
      const threadInfo = await api.getThreadInfo(event.threadID);

      // ✅ تحقق: هل هذا خاص أم مجموعة؟
      if (!threadInfo.isGroup) {
        return api.sendMessage(
          "⚠️ | هذا الأمر يشتغل فقط داخل المجموعات.",
          event.threadID,
          event.messageID
        );
      }

      // ✅ تحديد الشخص (ID أو رابط فيسبوك أو mention أو رد على رسالة)
      let targetID;

      // لو الأمر جاء كرد على رسالة
      if (event.type === "message_reply" && event.messageReply) {
        targetID = event.messageReply.senderID;
      }
      // لو فيه mention
      else if (Object.keys(event.mentions).length > 0) {
        targetID = Object.keys(event.mentions)[0];
      }
      // لو فيه ID أو رابط
      else if (args.length > 0) {
        targetID = args[0];

        // لو الرابط فيسبوك → حاول استخراج الـ ID
        if (targetID.includes("facebook.com")) {
          const match = targetID.match(/facebook\.com\/(\d+)/);
          if (match) {
            targetID = match[1];
          } else {
            return api.sendMessage(
              "⚠️ | الرابط غير صالح. لازم يكون فيه ID رقمي.",
              event.threadID,
              event.messageID
            );
          }
        }
      }

      if (!targetID) {
        return api.sendMessage(
          "⚠️ | لازم تكتب أيدي الشخص أو تعمل mention أو رد على رسالته أو رابط فيسبوك.",
          event.threadID,
          event.messageID
        );
      }

      // ✅ تحقق: هل الشخص موجود بالفعل في المجموعة؟
      const alreadyInGroup = threadInfo.participantIDs.includes(targetID);
      if (alreadyInGroup) {
        return api.sendMessage(
          "ℹ️ | هذا الشخص موجود بالفعل في المجموعة.",
          event.threadID,
          event.messageID
        );
      }

      // ✅ محاولة الإضافة
      api.addUserToGroup(targetID, event.threadID, (err) => {
        if (err) {
          let errorMsg = "❌ | فشل إضافة الشخص.\n";
          
          // تحليل نوع الخطأ
          if (err.message?.includes("not admin") || err.message?.includes("not authorized") || err.message?.includes("permission")) {
            errorMsg = "⚠️ | لازم البوت يصبح أدمن في المجموعة لإضافة أعضاء!";
          } else if (err.message?.includes("already") || err.message?.includes("member")) {
            errorMsg = "ℹ️ | هذا الشخص موجود بالفعل في المجموعة.";
          } else if (err.message?.includes("blocked")) {
            errorMsg = "🔍 | هذا الشخص محظور أو قد حظر المجموعة.";
          } else {
            errorMsg += `🔍 السبب: ${err.message || "خطأ غير معروف"}`;
          }
          
          return api.sendMessage(errorMsg, event.threadID, event.messageID);
        }
        api.sendMessage(
          `✅ | تم إدخال العضو (${targetID}) إلى المجموعة بنجاح!`,
          event.threadID,
          event.messageID
        );
      });
    } catch (err) {
      return api.sendMessage(
        "⚠️ | حصل خطأ غير متوقع:\n" + err.message,
        event.threadID,
        event.messageID
      );
    }
  }
}

export default new AddUser();