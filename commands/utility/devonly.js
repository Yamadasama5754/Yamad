import fs from "fs";

const configPath = "KaguyaSetUp/devOnlyMode.json";
const developerIDs = ["100092990751389"]; // ← عدّلهم حسب المطورين الحقيقيين

class DevOnly {
  constructor() {
    this.name = "المطور_فقط";
    this.version = "1.0";
    this.author = "Yamada KJ & Alastor";
    this.cooldowns = 5;
    this.role = 2;
    this.description = "تشغيل/إيقاف وضع المطور فقط (عام)";
    this.aliases = ["developer_only", "مطور_فقط"];
  }

  async execute({ api, event, args }) {
    const mode = args[0];
    if (!["تشغيل", "ايقاف"].includes(mode)) {
      return api.sendMessage(
        "⚠️ | استخدم: المطور_فقط تشغيل أو المطور_فقط ايقاف",
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