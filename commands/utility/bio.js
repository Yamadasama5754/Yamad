class BioCommand {
  constructor() {
    this.name = "بايو";
    this.author = "Yamada KJ & Alastor";
    this.role = 2;
    this.cooldowns = 10;
    this.description = "تغيير بايو البوت";
    this.aliases = ["بايو"];
  }

  async execute({ api, event, args }) {
    try {
      const content = args.join(" ") || "";
      if (!content) {
        return api.sendMessage("⚠️ | يرجى إدخال نص البايو المراد تعيينه", event.threadID, event.messageID);
      }

      await api.changeBio(content);
      api.sendMessage(`✅ | تم تغيير بايو البوت إلى: ${content} بنجاح`, event.threadID, event.messageID);
    } catch (err) {
      console.error("خطأ في تغيير البايو:", err);
      api.sendMessage("❌ | حدث خطأ أثناء تغيير البايو", event.threadID, event.messageID);
    }
  }
}

export default new BioCommand();
