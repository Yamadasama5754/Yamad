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

      const message = newState
        ? `✅ | تم تفعيل الإشعارات!`
        : `❌ | تم إيقاف الإشعارات! (الأوامر ستعمل بهدوء)`;

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

    if (mode === "تشغيل") {
      if (currentState) {
        return api.sendMessage(
          "ℹ️ | وضع الأدمن فقط مشغّل بالفعل في هذه المجموعة.",
          event.threadID,
          event.messageID
        );
      }
      configData[event.threadID] = { adminOnly: true };
      fs.writeFileSync(configPath, JSON.stringify(configData, null, 2));
      return api.sendMessage(
        "✅ | تم تفعيل وضع الأدمن فقط في هذه المجموعة. لن يستجيب البوت إلا للأدمن هنا.",
        event.threadID,
        event.messageID
      );
    }

    if (mode === "ايقاف") {
      if (!currentState) {
        return api.sendMessage(
          "ℹ️ | وضع الأدمن فقط متوقف بالفعل في هذه المجموعة.",
          event.threadID,
          event.messageID
        );
      }
      configData[event.threadID] = { adminOnly: false };
      fs.writeFileSync(configPath, JSON.stringify(configData, null, 2));
      return api.sendMessage(
        "❌ | تم إيقاف وضع الأدمن فقط في هذه المجموعة. يمكن للجميع استخدام البوت هنا.",
        event.threadID,
        event.messageID
      );
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

export default new AdminOnly();