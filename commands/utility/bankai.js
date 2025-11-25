import config from "../../KaguyaSetUp/config.js";

class Kick {
  constructor() {
    this.name = "طرد";
    this.author = "Yamada KJ & Alastor";
    this.cooldowns = 5;
    this.description = "طرد عضو من المجموعة (يتطلب أن يكون البوت أدمن). استخدم 'طرد الكل' لطرد الجميع (للمطور فقط).";
    this.role = 1; // للأدمن فقط
    this.aliases = ["بانكاي"];
  }

  async execute({ api, event, args }) {
    try {
      const threadID = event.threadID;
      const threadInfo = await api.getThreadInfo(threadID);
      const botID = api.getCurrentUserID();
      const senderID = event.senderID;

      // ✅ تحقق: هل هذا خاص أم مجموعة؟
      if (!threadInfo.isGroup) {
        return api.sendMessage(
          "⚠ | هذا الأمر يشتغل فقط داخل المجموعات.",
          threadID,
          event.messageID
        );
      }

      // ✅ تحقق: هل البوت أدمن؟
      if (!threadInfo.adminIDs.some(admin => admin.id === botID)) {
        return api.sendMessage(
          "⚠ | يجب أن يكون البوت أدمن حتى يقدر يطرد الأعضاء.",
          threadID,
          event.messageID
        );
      }

      // 🚫 IDs المحمية (المطورين والبوت)
      const protectedIDs = [...config.ADMIN_IDS, botID];

      // ✅ خيار "طرد الكل" - للمطور فقط
      if (args[0] && args[0].toLowerCase() === "الكل") {
        // تحقق: هل المستخدم مطور؟
        if (!config.ADMIN_IDS.includes(senderID)) {
          return api.sendMessage(
            "🔒 | فقط المطور يقدر يستخدم خاصية طرد الكل!",
            threadID,
            event.messageID
          );
        }

        const exemptIDs = new Set(protectedIDs);
        
        // إضافة الأيديات المستثناة المحددة من المستخدم
        if (args.length > 1) {
          for (let i = 1; i < args.length; i++) {
            exemptIDs.add(args[i]);
          }
        }

        const participantIDs = threadInfo.participantIDs;
        const toKick = participantIDs.filter(id => !exemptIDs.has(id));

        if (toKick.length === 0) {
          return api.sendMessage(
            "⚠ | لا يوجد أعضاء للطرد (الجميع محمين).",
            threadID,
            event.messageID
          );
        }

        api.sendMessage(
          `⏳ جاري طرد ${toKick.length} عضو...`,
          threadID,
          event.messageID
        );

        let kicked = 0;
        for (const id of toKick) {
          try {
            await api.removeUserFromGroup(id, threadID);
            kicked++;
            // تأخير صغير لتجنب rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));
          } catch (err) {
            console.error(`فشل طرد ${id}:`, err);
          }
        }

        return api.sendMessage(
          `✅ | تم طرد ${kicked} عضو من أصل ${toKick.length}`,
          threadID
        );
      }

      // ✅ جلب ID الهدف (الطرد العادي)
      let targetID;

      if (event.type === "message_reply" && event.messageReply) {
        targetID = event.messageReply.senderID;
      } else if (Object.keys(event.mentions).length > 0) {
        targetID = Object.keys(event.mentions)[0];
      } else if (args.length > 0) {
        targetID = args[0];
      }

      if (!targetID) {
        return api.sendMessage(
          "⚠ | من فضلك ضع ID أو اعمل mention أو رد على رسالة الشخص اللي تبغى تطرده.",
          threadID,
          event.messageID
        );
      }

      // 🚫 منع طردك الأشخاص المحمين
      if (protectedIDs.includes(targetID)) {
        return api.sendMessage(
          "🚫 | لا يمكن طرد هذا العضو لأنه محمي.",
          threadID,
          event.messageID
        );
      }

      // ✅ استخراج السبب لو موجود
      let reason = null;
      if (args.length > 1) {
        reason = args.slice(1).join(" ");
      } else if (Object.keys(event.mentions).length > 0 && args.length > 0) {
        reason = args.slice(1).join(" ");
      } else if (event.type === "message_reply" && args.length > 0) {
        reason = args.join(" ");
      }

      // تنفيذ الطرد
      await api.removeUserFromGroup(targetID, threadID);

      return api.sendMessage(
        reason
          ? `✅ | تم طرد العضو: ${targetID}\n📌 السبب: ${reason}`
          : `✅ | تم طرد العضو: ${targetID}`,
        threadID
      );
    } catch (err) {
      console.error("❌ خطأ في أمر طرد:", err);
      return api.sendMessage(
        "⚠ | حصل خطأ أثناء محاولة الطرد:\n" +
          (err?.message || JSON.stringify(err)),
        event.threadID,
        event.messageID
      );
    }
  }
}

export default new Kick();