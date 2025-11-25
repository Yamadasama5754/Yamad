import fs from "fs-extra";
import path from "path";

class BroadcastCommand {
  constructor() {
    this.name = "ابلاغ";
    this.author = "Yamada KJ & Alastor";
    this.cooldowns = 0;
    this.description = "إرسال ابلاغ لجميع المجموعات (مطور فقط) | الاستخدام: ابلاغ رسالتك هنا";
    this.role = 2;
    this.aliases = ["ابلاغ", "broadcast"];
  }

  async execute({ api, event, args }) {
    const developerID = "100092990751389";
    const { threadID, messageID, senderID } = event;

    if (senderID !== developerID) {
      return api.sendMessage(
        "❌ هذا الأمر متاح للمطور فقط",
        threadID,
        messageID
      );
    }

    const message = args.join(" ");
    if (!message) {
      return api.sendMessage(
        "❌ اكتب الرسالة المراد إرسالها\n\nالاستخدام: ابلاغ رسالتك هنا",
        threadID,
        messageID
      );
    }

    try {
      const threadsFile = path.join(process.cwd(), "database/threads.json");
      const threads = fs.readJsonSync(threadsFile);

      api.sendMessage("⏳ جاري الإرسال إلى جميع المجموعات...", threadID);

      let successCount = 0;
      let failCount = 0;

      for (const thread of threads) {
        try {
          await api.sendMessage(
            `📢 ابلاغ من المطور:\n\n${message}`,
            thread.threadID
          );
          successCount++;
          // تأخير بسيط لتجنب الحظر
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (err) {
          failCount++;
          console.error(`فشل في إرسال الابلاغ للمجموعة ${thread.threadID}:`, err.message);
        }
      }

      api.sendMessage(
        `✅ تم الإرسال بنجاح!\n\n📊 النتائج:\n✅ نجح: ${successCount}\n❌ فشل: ${failCount}\n📍 الإجمالي: ${threads.length}`,
        threadID,
        messageID
      );
    } catch (error) {
      console.error("Error in broadcast command:", error.message);
      api.sendMessage("❌ حدث خطأ أثناء الإرسال", threadID, messageID);
    }
  }
}

export default new BroadcastCommand();
