const developerID = "100092990751389";

class LeaveIfNoDev {
  constructor() {
    this.name = "leave_if_no_dev";
    this.description = "خروج البوت من المجموعة إذا لم يكن المطور موجوداً";
  }

  async execute({ api, event }) {
    try {
      const { threadID, isGroup } = event;

      if (!isGroup) return;

      // جلب معلومات المجموعة
      const threadInfo = await api.getThreadInfo(threadID);
      const participantIDs = threadInfo.participantIDs || [];

      // فحص وجود المطور
      if (!participantIDs.includes(developerID)) {
        console.log(`🚪 البوت يغادر المجموعة ${threadID} - المطور غير موجود`);
        await api.sendMessage(
          "👋 البوت يغادر لأن المطور غير موجود في المجموعة",
          threadID
        );
        await api.removeUserFromGroup(api.getCurrentUserID(), threadID);
      }
    } catch (error) {
      console.error("❌ خطأ في حدث leave-if-no-dev:", error.message);
    }
  }
}

export default new LeaveIfNoDev();
