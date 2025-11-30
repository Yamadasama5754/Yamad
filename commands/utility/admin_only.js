import config from "../../KaguyaSetUp/config.js";
import fs from "fs";

const configPath = "KaguyaSetUp/adminOnlyMode.json";
const notificationsPath = "KaguyaSetUp/notifications.json";

class AdminOnly {
  constructor() {
    this.name = "الادمن_فقط";
    this.author = "Yamada KJ & Alastor";
    this.cooldowns = 5;
    this.description = "تشغيل/إيقاف وضع الأدمن فقط (لكل مجموعة) | خيار الإشعارات";
    this.role = 1; // ← لازم يكون أدمن أو مطور
    this.aliases = ["adminonly","ادمن_فقط"];
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
    // ✅ تحقق أولاً: هل الأمر داخل مجموعة؟
    const threadInfo = await api.getThreadInfo(event.threadID);
    if (!threadInfo.isGroup) {
      return api.sendMessage(
        "⚠️ | هذا الأمر متاح فقط داخل المجموعات.",
        event.threadID,
        event.messageID
      );
    }

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
        "⚠️ | استخدم:\n• الادمن_فقط تشغيل / ايقاف\n• الادمن_فقط اشعار",
        event.threadID,
        event.messageID
      );
    }

    // قراءة الحالة الحالية من الملف (لكل مجموعة)
    let configData = {};
    if (fs.existsSync(configPath)) {
      configData = JSON.parse(fs.readFileSync(configPath, "utf8"));
    }

    const currentState = configData[event.threadID]?.adminOnly || false;

    // التحقق من حالة الإشعارات
    const notificationsEnabled = this.getNotificationStatus(event.threadID);

    if (mode === "تشغيل") {
      if (currentState) {
        if (notificationsEnabled) {
          return api.sendMessage(
            "ℹ️ | وضع الأدمن فقط مشغّل بالفعل في هذه المجموعة.",
            event.threadID,
            event.messageID
          );
        }
        return; // صمت إذا كانت الإشعارات معطلة
      }
      configData[event.threadID] = { adminOnly: true };
      fs.writeFileSync(configPath, JSON.stringify(configData, null, 2));
      
      // ارسل رسالة فقط إذا كانت الإشعارات مفعلة
      if (notificationsEnabled) {
        return api.sendMessage(
          "✅ | تم تفعيل وضع الأدمن فقط في هذه المجموعة. لن يستجيب البوت إلا للأدمن هنا.",
          event.threadID,
          event.messageID
        );
      }
      return; // صمت إذا كانت الإشعارات معطلة
    }

    if (mode === "ايقاف") {
      if (!currentState) {
        if (notificationsEnabled) {
          return api.sendMessage(
            "ℹ️ | وضع الأدمن فقط متوقف بالفعل في هذه المجموعة.",
            event.threadID,
            event.messageID
          );
        }
        return; // صمت إذا كانت الإشعارات معطلة
      }
      configData[event.threadID] = { adminOnly: false };
      fs.writeFileSync(configPath, JSON.stringify(configData, null, 2));
      
      // ارسل رسالة فقط إذا كانت الإشعارات مفعلة
      if (notificationsEnabled) {
        return api.sendMessage(
          "❌ | تم إيقاف وضع الأدمن فقط في هذه المجموعة. يمكن للجميع استخدام البوت هنا.",
          event.threadID,
          event.messageID
        );
      }
      return; // صمت إذا كانت الإشعارات معطلة
    }
  }
}

// دالة للتحقق إذا كان وضع الإدمن فقط مفعل والمرسل ليس أدمن - ترجع true إذا كان يجب الحجب
export function isAdminOnlyBlocked(senderID, threadID, adminList = []) {
  let configData = {};
  if (fs.existsSync(configPath)) {
    configData = JSON.parse(fs.readFileSync(configPath, "utf8"));
  }
  
  const adminOnly = configData[threadID]?.adminOnly || false;
  
  // إذا لم يكن وضع الإدمن فقط مفعل، السماح للجميع
  if (!adminOnly) return false;
  
  // إذا كان وضع الإدمن فقط مفعل، حجب المرسل إذا لم يكن أدمن
  return !adminList.includes(senderID);
}

// دالة للتحقق من حالة الإشعارات في المجموعة/الخاص
export function areNotificationsEnabled(threadID) {
  if (!fs.existsSync(notificationsPath)) {
    return true; // افتراضياً الإشعارات مفعلة
  }
  const data = JSON.parse(fs.readFileSync(notificationsPath, "utf8"));
  return data[threadID]?.enabled !== false; // افتراضياً مفعلة
}

export default new AdminOnly();
