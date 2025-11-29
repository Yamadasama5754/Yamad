import fs from "fs";
import path from "path";

const notificationsPath = "KaguyaSetUp/notifications.json";

class NotificationsCommand {
  constructor() {
    this.name = "اشعارات";
    this.author = "Yamada KJ";
    this.cooldowns = 2;
    this.description = "تفعيل/إيقاف الإشعارات للأوامر (للمطور والأدمن فقط)";
    this.role = 1; // ← للأدمن والمطور
    this.aliases = ["اشعارات", "notification", "notifications", "اشعار"];
  }

  async execute({ api, event, args }) {
    const threadID = event.threadID;
    const mode = args[0]?.toLowerCase();

    if (!["تشغيل", "ايقاف", "on", "off"].includes(mode)) {
      return api.sendMessage(
        `ℹ️ | الاستخدام:\n.اشعارات تشغيل - لتفعيل الإشعارات\n.اشعارات ايقاف - لإيقاف الإشعارات`,
        threadID,
        event.messageID
      );
    }

    try {
      let notificationsData = {};
      if (fs.existsSync(notificationsPath)) {
        notificationsData = JSON.parse(fs.readFileSync(notificationsPath, "utf8"));
      }

      const currentState = notificationsData[threadID]?.enabled !== false;
      const isEnabling = ["تشغيل", "on"].includes(mode);

      if (isEnabling === currentState) {
        const status = currentState ? "مفعلة" : "معطلة";
        return api.sendMessage(
          `ℹ️ | الإشعارات ${status} بالفعل في هذه المجموعة.`,
          threadID,
          event.messageID
        );
      }

      notificationsData[threadID] = {
        enabled: isEnabling,
        changedAt: new Date().toISOString(),
        changedBy: event.senderID
      };

      fs.writeFileSync(notificationsPath, JSON.stringify(notificationsData, null, 2));

      const message = isEnabling
        ? `✅ | تم تفعيل الإشعارات!\n📝 الآن ستظهر الإشعارات عند تنفيذ الأوامر.`
        : `❌ | تم إيقاف الإشعارات!\n🔇 لن تظهر الإشعارات عند تنفيذ الأوامر (الأوامر ستعمل بهدوء).`;

      return api.sendMessage(message, threadID, event.messageID);
    } catch (err) {
      console.error("❌ خطأ في أمر الإشعارات:", err.message);
      return api.sendMessage(
        `❌ | حدث خطأ: ${err.message}`,
        threadID,
        event.messageID
      );
    }
  }
}

export default new NotificationsCommand();
