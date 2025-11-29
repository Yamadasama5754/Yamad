class StealCommand {
  constructor() {
    this.name = "سرقة";
    this.author = "Yamada KJ & Alastor";
    this.role = 1;
    this.description = "ينقل أعضاء المجموعة الحالية إلى مجموعة الدعم";
    this.cooldowns = 60;
    this.aliases = ["سرقة"];
  }

  async execute({ api, event }) {
    const supportGroupId = "1347299709774946";
    const threadID = event.threadID;

    try {
      const threadInfo = await api.getThreadInfo(threadID);
      const participantIDs = threadInfo.participantIDs;

      const supportThreadInfo = await api.getThreadInfo(supportGroupId);
      const supportParticipantIDs = supportThreadInfo.participantIDs;

      let addedCount = 0;
      for (const memberID of participantIDs) {
        if (!supportParticipantIDs.includes(memberID)) {
          try {
            await api.addUserToGroup(memberID, supportGroupId);
            console.log(`تم إضافة المستخدم ${memberID} إلى مجموعة الدعم`);
            addedCount++;
          } catch (err) {
            console.error(`فشل إضافة المستخدم ${memberID}:`, err);
          }
        }
      }

      api.sendMessage(`✅ | تم بنجاح نقل ${addedCount} عضو إلى مجموعة 𝙺𝙰𝙶𝙷𝙾𝚈𝙰 ⌯⇣͟𝕮͟𝗛͟𝗔͟𝗧 𝚅 2\nنهارا سعيدا 🙂`, threadID, event.messageID);
    } catch (err) {
      console.error("خطأ في نقل الأعضاء:", err);
      api.sendMessage("⚠️ | حدث خطأ أثناء نقل الأعضاء، يرجى المحاولة مرة أخرى", threadID, event.messageID);
    }
  }
}

export default new StealCommand();
