const developerID = "100092990751389";

class BotRemovedNotification {
  constructor() {
    this.name = "bot_removed_notification";
    this.description = "إرسال إشعار للمطور عند طرد البوت من مجموعة";
  }

  async execute({ api, event }) {
    try {
      const { threadID } = event;
      
      try {
        const threadInfo = await api.getThreadInfo(threadID);
        const threadName = threadInfo.threadName || "مجموعة بدون اسم";
        
        console.log(`🚫 البوت تم طرده من المجموعة: ${threadID} - ${threadName}`);
        
        // إرسال إشعار للمطور
        await api.sendMessage(
          `🚫 تنبيه: تم طرد البوت من المجموعة\n📍 المجموعة: ${threadName}\n🆔 الكود: ${threadID}`,
          developerID
        );
      } catch (err) {
        // محاولة إرسال رسالة بدون معلومات إضافية
        await api.sendMessage(
          `🚫 تنبيه: تم طرد البوت من مجموعة\n🆔 الكود: ${threadID}`,
          developerID
        );
      }
    } catch (error) {
      console.error("❌ خطأ في حدث bot-removed-notification:", error.message);
    }
  }
}

export default new BotRemovedNotification();
