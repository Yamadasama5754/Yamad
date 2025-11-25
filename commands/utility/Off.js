class DisableCommand {
  constructor() {
    this.name = "تعطيل";
    this.author = "Yamada KJ & Alastor";
    this.cooldowns = 0;
    this.description = "تعطيل البوت في المجموعة (يرد فقط على المطور) | الاستخدام: تعطيل";
    this.role = 2;
    this.aliases = ["تعطيل", "disable"];
  }

  async execute({ api, event, Threads }) {
    const developerID = "100092990751389";
    
    if (event.senderID !== developerID) {
      return api.sendMessage(
        "❌ هذا الأمر متاح للمطور فقط",
        event.threadID,
        event.messageID
      );
    }

    try {
      await Threads.update(event.threadID, {
        botDisabled: true
      });

      api.sendMessage(
        "🔴 تم تعطيل البوت في هذه المجموعة\n(سيرد فقط على المطور)",
        event.threadID,
        event.messageID
      );
    } catch (err) {
      console.error("Error disabling bot:", err);
      api.sendMessage("❌ حدث خطأ", event.threadID);
    }
  }
}

export default new DisableCommand();
