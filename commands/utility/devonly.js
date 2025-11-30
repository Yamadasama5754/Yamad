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

  // دالة مساعدة للتحقق من حالة الإشعارات
  getNotificationStatus(threadID) {
    if (!fs.existsSync(notificationsPath)) {
      return true; // افتراضياً الإشعارات مفعلة
    }
    const data = JSON.parse(fs.readFileSync(notificationsPath, "utf8"));
    return data[threadID]?.enabled !== false; // افتراضياً مفعلة
  }

  async execute({ api, event, args }) {
    const mode = args[0];

    // خيار الإشعارات (تبديل)
    if (mode === "اشعار") {
      let notificationsData = {};
      if (fs.existsSync(notificationsPath)) {
        notificationsData = JSON.parse(fs.readFileSync(notificationsPath, "utf8"));
      }

      const currentState = notificationsData[event.threadID]?.enabled !== false;
      const newState = !currentState; // تبديل الحالة

      notificationsData[event.threadID] = { enabled: newState };
      fs.writeFileSync(notificationsPath, JSON.stringify(notificationsData, null, 2));

      // إذا تم إيقاف الإشعارات، لا ترسل رسالة
      if (!newState) {
        return; // صمت - لا رسالة
      }

      // إذا تم تفعيل الإشعارات، ارسل رسالة
      const message = `✅ | تم تفعيل الإشعارات!`;
      return api.sendMessage(message, event.threadID, event.messageID);
    }

    // الخيارات الأصلية
    if (!["تشغيل", "ايقاف"].includes(mode)) {
      return api.sendMessage(
        "⚠️ | استخدم:\n• المطور_فقط تشغيل / ايقاف\n• المطور_فقط اشعار",
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

    // التحقق من حالة الإشعارات
    const notificationsEnabled = this.getNotificationStatus(event.threadID);

    if (mode === "تشغيل") {
      if (currentState) {
        if (notificationsEnabled) {
          return api.sendMessage("ℹ️ | وضع المطور فقط مشغّل بالفعل.", event.threadID, event.messageID);
        }
        return; // صمت إذا كانت الإشعارات معطلة
      }
      fs.writeFileSync(configPath, JSON.stringify({ devOnly: true }, null, 2));
      
      // ارسل رسالة فقط إذا كانت الإشعارات مفعلة
      if (notificationsEnabled) {
        return api.sendMessage("✅ | تم تفعيل وضع المطور فقط. الأوامر متاحة للمطورين فقط.", event.threadID, event.messageID);
      }
      return; // صمت إذا كانت الإشعارات معطلة
    }

    if (mode === "ايقاف") {
      if (!currentState) {
        if (notificationsEnabled) {
          return api.sendMessage("ℹ️ | وضع المطور فقط متوقف بالفعل.", event.threadID, event.messageID);
        }
        return; // صمت إذا كانت الإشعارات معطلة
      }
      fs.writeFileSync(configPath, JSON.stringify({ devOnly: false }, null, 2));
      
      // ارسل رسالة فقط إذا كانت الإشعارات مفعلة
      if (notificationsEnabled) {
        return api.sendMessage("❌ | تم إيقاف وضع المطور فقط. يمكن للجميع استخدام البوت.", event.threadID, event.messageID);
      }
      return; // صمت إذا كانت الإشعارات معطلة
    }
  }
}

// دالة مساعدة لفحص الوضع قبل تنفيذ أي أمر - ترجع true إذا كان يمكن المتابعة
export function checkDevOnly(senderID) {
  let devOnly = false;
  if (fs.existsSync(configPath)) {
    const { devOnly: state } = JSON.parse(fs.readFileSync(configPath, "utf8"));
    devOnly = !!state;
  }
  // ترجع true إذا كانت وضع المطور معطل (يمكن الجميع المتابعة) 
  // أو إذا كان المرسل مطور (يمكن المطور المتابعة)
  return !devOnly || developerIDs.includes(senderID);
}

// دالة للتحقق إذا كان وضع المطور مفعل والمرسل ليس مطور - ترجع true إذا كان يجب الحجب
export function isDevOnlyBlocked(senderID) {
  let devOnly = false;
  if (fs.existsSync(configPath)) {
    const { devOnly: state } = JSON.parse(fs.readFileSync(configPath, "utf8"));
    devOnly = !!state;
  }
  return devOnly && !developerIDs.includes(senderID);
}

export default new DevOnly();
