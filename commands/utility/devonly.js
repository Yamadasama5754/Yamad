import fs from "fs";

const configPath = "KaguyaSetUp/devOnlyMode.json";
const notificationsPath = "KaguyaSetUp/notifications.json";
const developerIDs = ["100092990751389"]; // ← عدّلهم حسب المطورين الحقيقيين

class DevOnly {
  constructor() {
    this.name = "المطور_فقط";
    this.version = "1.0";
    this.author = "Yamada KJ & Alastor";
    this.cooldowns = 5;
    this.role = 2;
    this.description = "تشغيل/إيقاف وضع المطور فقط (عام) | خيار الإشعارات";
    this.aliases = ["developer_only", "مطور_فقط"];
  }

  async execute({ api, event, args }) {
    const mode = args[0];
    const subMode = args[1];

    // خيار الإشعارات
    if (mode === "اشعار") {
      if (!["تشغيل", "ايقاف"].includes(subMode)) {
        return api.sendMessage(
          "⚠️ | استخدم: المطور_فقط اشعار تشغيل أو المطور_فقط اشعار ايقاف",
          event.threadID,
          event.messageID
        );
      }

      let notificationsData = {};
      if (fs.existsSync(notificationsPath)) {
        notificationsData = JSON.parse(fs.readFileSync(notificationsPath, "utf8"));
      }

      const currentState = notificationsData[event.threadID]?.enabled !== false;
      const isEnabling = subMode === "تشغيل";

      if (isEnabling === currentState) {
        const status = currentState ? "مفعلة" : "معطلة";
        return api.sendMessage(
          `ℹ️ | الإشعارات ${status} بالفعل.`,
          event.threadID,
          event.messageID
        );
      }

      notificationsData[event.threadID] = { enabled: isEnabling };
      fs.writeFileSync(notificationsPath, JSON.stringify(notificationsData, null, 2));

      const message = isEnabling
        ? `✅ | تم تفعيل الإشعارات!`
        : `❌ | تم إيقاف الإشعارات! (الأوامر ستعمل بهدوء)`;

      return api.sendMessage(message, event.threadID, event.messageID);
    }

    // الخيارات الأصلية
    if (!["تشغيل", "ايقاف"].includes(mode)) {
      return api.sendMessage(
        "⚠️ | استخدم:\n• المطور_فقط تشغيل / ايقاف\n• المطور_فقط اشعار تشغيل / ايقاف",
        event.threadID,
        event.messageID
      );
    }

    // قراءة الحالة الحالية من الملف
    let currentState = false;
    if (fs.existsSync(configPath)) {
      const { devOnly } = JSON.parse(fs.readFileSync(configPath, "utf8"));
      currentState = !!devOnly;
    }

    if (mode === "تشغيل") {
      if (currentState) {
        return api.sendMessage("ℹ️ | وضع المطور فقط مشغّل بالفعل.", event.threadID, event.messageID);
      }
      fs.writeFileSync(configPath, JSON.stringify({ devOnly: true }, null, 2));
      return api.sendMessage("✅ | تم تفعيل وضع المطور فقط. الأوامر متاحة للمطورين فقط.", event.threadID, event.messageID);
    }

    if (mode === "ايقاف") {
      if (!currentState) {
        return api.sendMessage("ℹ️ | وضع المطور فقط متوقف بالفعل.", event.threadID, event.messageID);
      }
      fs.writeFileSync(configPath, JSON.stringify({ devOnly: false }, null, 2));
      return api.sendMessage("❌ | تم إيقاف وضع المطور فقط. يمكن للجميع استخدام البوت.", event.threadID, event.messageID);
    }
  }
}

// دالة مساعدة لفحص الوضع قبل تنفيذ أي أمر
export function checkDevOnly(senderID) {
  let devOnly = false;
  if (fs.existsSync(configPath)) {
    const { devOnly: state } = JSON.parse(fs.readFileSync(configPath, "utf8"));
    devOnly = !!state;
  }
  return !devOnly || developerIDs.includes(senderID);
}

export default new DevOnly();