import { commandMiddleware, eventMiddleware } from "../../middleware/index.js";

class Restart {
  constructor() {
    this.name = "اعادة_تشغيل";
    this.author = "Yamada KJ & Alastor";
    this.cooldowns = 30;
    this.description = "يعيد تحميل الأوامر والأحداث";
    this.role = 2;
    this.aliases = ["restart", "ريستارت"];
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async execute({ api, event }) {
    try {
      api.setMessageReaction("🔄", event.messageID, (err) => {}, true);

      // الحصول على عدد الأوامر والأحداث الحالية
      const oldCommandCount = global.client.commands.size;
      const oldEventCount = global.client.events.size;

      // إرسال رسالة البداية
      api.sendMessage(
        `🔁 جاري إعادة تحميل الأوامر والأحداث...`,
        event.threadID
      );

      // الانتظار قليلاً
      await this.sleep(1500);

      // ✅ تنظيف الذاكرة
      global.client.commands.clear();
      global.client.events.clear();
      global.client.aliases.clear();
      global.client.cooldowns.clear();
      global.client.commandFunctions.clear();
      global.client.eventFunctions.clear();

      // ✅ إعادة تحميل الأوامر والأحداث بفعل!
      await commandMiddleware();
      await eventMiddleware();

      const newCommandCount = global.client.commands.size;
      const newEventCount = global.client.events.size;

      // إرسال رسالة النجاح
      api.sendMessage(
        `✅ تم إعادة التحميل بنجاح!\n\n` +
        `📊 الأوامر القديمة: ${oldCommandCount} → الجديدة: ${newCommandCount}\n` +
        `📊 الأحداث القديمة: ${oldEventCount} → الجديدة: ${newEventCount}`,
        event.threadID
      );

      api.setMessageReaction("✅", event.messageID, (err) => {}, true);

    } catch (err) {
      console.error("❌ خطأ في اعادة_تشغيل:", err);
      api.sendMessage(
        `❌ خطأ في إعادة التحميل: ${err.message}`,
        event.threadID
      );
      api.setMessageReaction("❌", event.messageID, (err) => {}, true);
    }
  }
}

export default new Restart();
