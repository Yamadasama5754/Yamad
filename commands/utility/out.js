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
      const developerIDs = ["100092990751389", "61578918847847"];
      const senderID = event.senderID;

      // فقط المطور يستطيع استخدام هذا الأمر
      if (!developerIDs.includes(senderID)) {
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
        try {
          let leftCount = 0;
          const failedGroups = [];

          // محاولة الحصول على قائمة المجموعات بطريقة مختلفة
          let threads = [];
          try {
            threads = await api.getThreadList(200, null, ["INBOX"]);
          } catch (e) {
            console.log("محاولة بديلة للحصول على قائمة المجموعات");
            threads = [];
          }

          if (!threads || threads.length === 0) {
            return api.sendMessage(
              "ℹ️ | البوت قد يكون في عدد قليل من المجموعات أو هناك خطأ في الوصول.\nجرب الأمر: غادري (بدون الكل) للخروج من هذه المجموعة فقط.",
              event.threadID,
              event.messageID
            );
          }

          for (const thread of threads) {
            if (!thread.isGroup) continue;
            if (thread.threadID === event.threadID) continue;

            try {
              const info = await api.getThreadInfo(thread.threadID);
              const groupName = info.threadName || thread.threadID;

              global.botLeavingByCommand = true;

              try {
                await api.sendMessage("👋 | البوت سيغادر هذه المجموعة الآن.", thread.threadID);
              } catch (e) {
                // تجاهل خطأ الرسالة
              }

              await new Promise(r => setTimeout(r, 300));
              
              try {
                await api.removeUserFromGroup(botID, thread.threadID);
                leftCount++;
              } catch (removeErr) {
                failedGroups.push(thread.threadID);
              }
            } catch (err) {
              failedGroups.push(thread.threadID);
            }
          }

          let resultMsg = `تم معالجة ${threads.filter(t => t.isGroup && t.threadID !== event.threadID).length} مجموعة:`;
          if (leftCount > 0) resultMsg += `\n✅ خروج ناجح من: ${leftCount}`;
          if (failedGroups.length > 0) resultMsg += `\n⚠️ فشل في: ${failedGroups.length}`;

          return api.sendMessage(resultMsg + "\n\nملاحظة: قد ترفض بعض المجموعات الخروج من API فيسبوك", event.threadID);
        } catch (err) {
          return api.sendMessage(
            `⚠️ | حدث خطأ: ${err.message}`,
            event.threadID,
            event.messageID
          );
        }
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