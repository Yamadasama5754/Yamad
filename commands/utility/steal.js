class StealCommand {
  constructor() {
    this.name = "سرقة";
    this.author = "Kaguya Project";
    this.role = 1;
    this.description = "يستولي على أعضاء المجموعة الحالية وينقلهم إلى مجموعة الدعم";
    this.cooldowns = 60;
    this.aliases = ["steal", "سرقة"];
  }

  async execute({ api, event }) {
    const supportGroupId = "7474918272587613";
    const threadID = event.threadID;

    try {
      api.setMessageReaction("⏳", event.messageID, (err) => {}, true);

      const threadInfo = await api.getThreadInfo(threadID);
      const participantIDs = threadInfo.participantIDs;

      const supportThreadInfo = await api.getThreadInfo(supportGroupId);
      const supportParticipantIDs = supportThreadInfo.participantIDs;

      let addedCount = 0;
      let skippedCount = 0;
      let failedCount = 0;

      for (const memberID of participantIDs) {
        if (!supportParticipantIDs.includes(memberID)) {
          try {
            await new Promise((resolve, reject) => {
              api.addUserToGroup(memberID, supportGroupId, (err) => {
                if (err) reject(err);
                else resolve();
              });
            });
            addedCount++;
            console.log(`✅ تم إضافة ${memberID} إلى مجموعة الدعم`);
            // تأخير لتجنب Rate Limiting
            await new Promise(resolve => setTimeout(resolve, 500));
          } catch (err) {
            failedCount++;
            console.error(`❌ فشل إضافة ${memberID}:`, err);
          }
        } else {
          skippedCount++;
        }
      }

      api.setMessageReaction("✅", event.messageID, (err) => {}, true);

      const resultMessage = `
✅ تم سرقة الأعضاء بنجاح!
━━━━━━━━━━━━━━━━
👥 تم إضافة: ${addedCount}
⏭️ تم تخطي: ${skippedCount}
⚠️ فشل: ${failedCount}
━━━━━━━━━━━━━━━━
مجموعة: 𝙺𝙰𝙶𝙷𝙾𝚈𝙰 ⌯⇣͟𝕮͟𝗛͟𝗔͟𝗧 𝚅 2
      `;

      api.sendMessage(resultMessage, threadID, event.messageID);

    } catch (err) {
      console.error("❌ خطأ في عملية السرقة:", err);
      api.setMessageReaction("❌", event.messageID, (err) => {}, true);
      api.sendMessage(
        "⚠️ | حدث خطأ أثناء الشروع في سرقة الأعضاء، يرجى المحاولة لاحقاً",
        threadID,
        event.messageID
      );
    }
  }
}

export default new StealCommand();
