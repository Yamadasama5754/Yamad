class EnableCommand {
  constructor() {
    this.name = "تشغيل";
    this.author = "Yamada KJ & Alastor";
    this.cooldowns = 0;
    this.description = "تشغيل البوت في المجموعة | الاستخدام: تشغيل";
    this.role = 2;
    this.aliases = ["تشغيل", "enable"];
    this.hidden = true;
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
        botDisabled: false
      });

      api.sendMessage(
        "🟢 تم تشغيل البوت في هذه المجموعة",
        event.threadID,
        event.messageID
      );
    } catch (err) {
      console.error("Error enabling bot:", err);
      api.sendMessage("❌ حدث خطأ", event.threadID);
    }
  }
}

export default new EnableCommand();
