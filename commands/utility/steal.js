class StealCommand {
  constructor() {
    this.name = "سرقة";
    this.author = "Yamada KJ & Alastor";
    this.role = 1;
    this.description = "سرقة عضو عشوائي من المجموعة وإضافته إلى مجموعة أخرى";
    this.cooldowns = 10;
    this.aliases = ["سرقة", "steal"];
  }

  async execute({ api, event, args }) {
    const threadID = event.threadID;

    try {
      // الحصول على معلومات المجموعة الحالية
      const threadInfo = await api.getThreadInfo(threadID);
      
      if (!threadInfo.isGroup) {
        return api.sendMessage(
          "⚠️ | هذا الأمر متاح فقط في المجموعات!",
          threadID,
          event.messageID
        );
      }

      const participantIDs = threadInfo.participantIDs || [];
      
      if (participantIDs.length === 0) {
        return api.sendMessage(
          "⚠️ | لا توجد أعضاء في هذه المجموعة!",
          threadID,
          event.messageID
        );
      }

      // إزالة البوت من قائمة الأعضاء المراد سرقتهم
      const botID = api.getCurrentUserID();
      const selectableMembers = participantIDs.filter(id => id !== botID);

      if (selectableMembers.length === 0) {
        return api.sendMessage(
          "⚠️ | لا يمكن سرقة البوت!",
          threadID,
          event.messageID
        );
      }

      // اختيار عضو عشوائي
      const randomMember = selectableMembers[Math.floor(Math.random() * selectableMembers.length)];

      try {
        const memberInfo = await api.getUserInfo(randomMember);
        const memberName = memberInfo[randomMember]?.name || "عضو غير معروف";

        // محاولة إزالة العضو من المجموعة
        try {
          await api.removeUserFromGroup(randomMember, threadID);
          
          api.sendMessage(
            `🚨🚨🚨 تم سرقة ${memberName} بنجاح! 🚨🚨🚨\n\n👤 | الضحية: ${memberName}\n🔐 | المعرف: ${randomMember}\n⏰ | الوقت: الآن\n\n😈 تم حذف العضو من المجموعة!`,
            threadID
          );

          console.log(`✅ تم سرقة العضو ${memberName} (${randomMember}) من المجموعة`);
        } catch (removeErr) {
          // إذا فشلت الإزالة، أرسل رسالة تنويه فقط
          api.sendMessage(
            `🚨 تم استهداف ${memberName}! 🚨\n\n👤 | الضحية: ${memberName}\n🔐 | المعرف: ${randomMember}\n\n⚠️ لكن لم أتمكن من إزالته (قد لا أملك الأذونات)`,
            threadID
          );

          console.warn(`⚠️ لم يتمكن من إزالة العضو ${memberName}: ${removeErr.message}`);
        }
      } catch (infoErr) {
        api.sendMessage(
          `🚨 تم استهداف عضو! 🚨\n\n🔐 | المعرف: ${randomMember}`,
          threadID
        );
      }
    } catch (err) {
      console.error("❌ خطأ في أمر السرقة:", err);
      api.sendMessage(
        `❌ | حدث خطأ: ${err.message || "خطأ غير متوقع"}`,
        threadID,
        event.messageID
      );
    }
  }
}

export default new StealCommand();
