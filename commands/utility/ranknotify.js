class RankupNotify {
  constructor() {
    this.name = "الرانك";
    this.author = "Yamada KJ & Enhanced";
    this.cooldowns = 5;
    this.description = "تفعيل أو تعطيل إشعارات الرانك عند صعود المستوى";
    this.role = 1; // للأدمن فقط
    this.aliases = ["الرانك", "ranknotify", "رانك"];
  }

  async execute({ api, event, Threads }) {
    try {
      const { threadID, messageID } = event;
      
      // الحصول على بيانات المجموعة
      const threadData = await Threads.find(threadID);
      if (!threadData.status) {
        return api.sendMessage("❌ خطأ في الوصول إلى بيانات المجموعة", threadID, messageID);
      }

      // التبديل بين تفعيل وتعطيل
      let data = threadData.data.data || {};
      
      if (typeof data.rankupNotify === "undefined" || data.rankupNotify === false) {
        data.rankupNotify = true;
        await Threads.setData(threadID, { data });
        
        return api.sendMessage(
          "✅ | تم تفعيل إشعارات المستوى\n🎉 | سيتم إخطار الأعضاء عند صعودهم للمستوى الجديد",
          threadID,
          messageID
        );
      } else {
        data.rankupNotify = false;
        await Threads.setData(threadID, { data });
        
        return api.sendMessage(
          "❌ | تم تعطيل إشعارات المستوى\n⚪ | لن يتم إخطار الأعضاء عند صعودهم",
          threadID,
          messageID
        );
      }

    } catch (error) {
      console.error("RankNotify error:", error);
      api.sendMessage(
        `❌ حدث خطأ: ${error.message}`,
        event.threadID,
        event.messageID
      );
    }
  }
}

export default new RankupNotify();
