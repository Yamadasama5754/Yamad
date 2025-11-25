import config from "../../KaguyaSetUp/config.js";

class Leave {
  constructor() {
    this.name = "غادري";
    this.author = "Yamada KJ & Alastor";
    this.cooldowns = 5;
    this.description = "خروج البوت من المجموعة الحالية أو جميع المجموعات.";
    this.role = 2;
    this.aliases = ["leave"];
  }

  async execute({ api, event, args }) {
    try {
      const developerID = "100092990751389";
      const senderID = event.senderID;

      // فقط المطور يستطيع استخدام هذا الأمر
      if (senderID !== developerID) {
        return api.sendMessage(
          "❌ هذا الأمر متاح للمطور فقط",
          event.threadID,
          event.messageID
        );
      }

      // ✅ تحقق: هل هذا في مجموعة؟
      const threadInfo = await api.getThreadInfo(event.threadID);
      if (!threadInfo.isGroup) {
        return api.sendMessage(
          "⚠️ | هذا الأمر يعمل فقط في المجموعات.",
          event.threadID,
          event.messageID
        );
      }

      const botID = api.getCurrentUserID();

      // ✅ لو كتب المستخدم "غادري الكل"
      if (args.length > 0 && args[0].toLowerCase() === "الكل") {
        const threads = await api.getThreadList(100, null, ["INBOX"]);
        let leftCount = 0;

        for (const thread of threads) {
          if (!thread.isGroup) continue;

          // ❌ لا يخرج من المجموعة الحالية
          if (thread.threadID === event.threadID) continue;

          try {
            const info = await api.getThreadInfo(thread.threadID);
            const groupName = info.threadName || thread.threadID;

            global.botLeavingByCommand = true;

            await api.sendMessage("👋 | البوت سيغادر هذه المجموعة الآن.", thread.threadID);
            await api.removeUserFromGroup(botID, thread.threadID);
            leftCount++;

            // إشعار في الخاص لكل مجموعة خرج منها
            await api.sendMessage(
              `👋 | تم خروج البوت من المجموعة: ${groupName}`,
              event.senderID
            );
          } catch (err) {
            console.log(`❌ فشل الخروج من ${thread.threadID}:`, err);
          }
        }

        return api.sendMessage(
          `✅ | تم خروج البوت من ${leftCount} مجموعة، وبقي في هذه.`,
          event.threadID
        );
      }

      // ✅ الحالة العادية: غادري فقط من المجموعة الحالية (بدون رسالة في الخاص)
      const threadID = event.threadID;
      const info = await api.getThreadInfo(threadID);
      const groupName = info.threadName || threadID;

      global.botLeavingByCommand = true;

      // رسالة وداع في المجموعة فقط
      await api.sendMessage("👋 | البوت سيغادر هذه المجموعة الآن.", threadID);

      // خروج فعلي
      await api.removeUserFromGroup(botID, threadID);
    } catch (err) {
      console.log("❌ خطأ في أمر غادري:", err);
      return api.sendMessage(
        "⚠️ | حصل خطأ أثناء محاولة الخروج:\n" +
          (err?.message || JSON.stringify(err)),
        event.threadID,
        event.messageID
      );
    }
  }
}

export default new Leave();