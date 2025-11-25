const developerID = "100092990751389";

class BotRemovedNotification {
  constructor() {
    this.name = "bot_removed_notification";
    this.description = "إرسال إشعار للمطور عند طرد البوت من مجموعة";
  }

  async execute({ api, event }) {
    // فقط يعمل على حدث طرد البوت من مجموعة
    if (!event.isGroup) return;

    try {
      const { threadID } = event;
      
      console.log(`🚫 البوت تم طرده من المجموعة: ${threadID}`);
      
      // محاولة الحصول على اسم المجموعة قبل الطرد
      let groupName = "مجموعة غير معروفة";
      try {
        const threadInfo = await api.getThreadInfo(threadID);
        if (threadInfo && threadInfo.threadName) {
          groupName = threadInfo.threadName;
        }
      } catch (err) {
        // لا نرسل رسالة إذا فشل جلب المعلومات
      }
      
      // إرسال إشعار للمطور فقط مرة واحدة
      try {
        await api.sendMessage(
          `🚫 تنبيه طرد البوت\n📍 المجموعة: ${groupName}\n🆔 الكود: ${threadID}\n⏰ الوقت: ${new Date().toLocaleString('ar-SA')}`,
          developerID
        );
      } catch (sendErr) {
        console.error("فشل إرسال الإشعار للمطور:", sendErr.message);
      }
    } catch (error) {
      console.error("❌ خطأ في حدث bot-removed-notification:", error.message);
    }
  }
}

export default new BotRemovedNotification();
