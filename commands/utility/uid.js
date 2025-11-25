class MyID {
  constructor() {
    this.name = "ايدي";
    this.author = "Yamada KJ & Alastor";
    this.cooldowns = 3;
    this.description = "يرسل الأيدي الخاص بالمرسل أو الشخص المردود عليه";
    this.role = 0;
    this.aliases = ["id"];
  }

  async execute({ api, event }) {
    try {
      let targetID;

      // إذا فيه رد على رسالة، نجيب أيدي صاحبها
      if (event.messageReply) {
        targetID = event.messageReply.senderID;
      } else {
        // إذا ما فيه رد، نجيب أيدي المرسل نفسه
        targetID = event.senderID;
      }

      await api.sendMessage(targetID, event.threadID, event.messageID);
    } catch (err) {
      await api.sendMessage("⚠️ | حصل خطأ أثناء جلب الأيدي.", event.threadID, event.messageID);
    }
  }
}

export default new MyID();