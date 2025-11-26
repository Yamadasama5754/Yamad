class Unsend {
  constructor() {
    this.name = "حذف";
    this.author = "Yamada KJ & Alastor";
    this.cooldowns = 5;
    this.description = "حذف آخر رسالة أرسلها البوت";
    this.role = 0;
    this.aliases = ["حذف", "unsend"];
  }

  async execute({ api, event }) {
    try {
      // التحقق من أن الرسالة ردة على رسالة
      if (!event.messageReply) {
        return api.sendMessage(
          "❌ يرجى الرد على رسالة البوت التي تريد حذفها",
          event.threadID,
          event.messageID
        );
      }

      // التحقق من أن الرسالة المرد عليها أرسلها البوت
      const botID = api.getCurrentUserID();
      if (event.messageReply.senderID !== botID) {
        return api.sendMessage(
          "❌ يمكنك فقط حذف رسائل البوت",
          event.threadID,
          event.messageID
        );
      }

      // حذف الرسالة
      await api.unsendMessage(event.messageReply.messageID);
      api.setMessageReaction("✅", event.messageID, () => {}, true);
    } catch (err) {
      console.error("Error unsending message:", err);
      api.sendMessage(
        "❌ حدث خطأ في حذف الرسالة: " + (err?.message || "خطأ غير معروف"),
        event.threadID,
        event.messageID
      );
    }
  }
}

export default new Unsend();
