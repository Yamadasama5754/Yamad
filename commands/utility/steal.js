import fs from "fs";

const stealConfigPath = "KaguyaSetUp/stealConfig.json";

class StealCommand {
  constructor() {
    this.name = "سرقة";
    this.author = "Yamada KJ & Alastor - Enhanced";
    this.role = 1;
    this.description = "سرقة جميع أعضاء مجموعة وإضافتهم إلى مجموعة دعم | استخدام: سرقة [معرف] | سرقة تبديل [معرف]";
    this.cooldowns = 20;
    this.aliases = ["سرقة", "steal"];
  }

  getDefaultSupportGroup() {
    return "1347299709774946";
  }

  getSupportGroup() {
    try {
      if (!fs.existsSync(stealConfigPath)) {
        return this.getDefaultSupportGroup();
      }
      const data = JSON.parse(fs.readFileSync(stealConfigPath, "utf8"));
      return data.supportGroupId || this.getDefaultSupportGroup();
    } catch (err) {
      return this.getDefaultSupportGroup();
    }
  }

  setSupportGroup(groupId) {
    try {
      const data = { supportGroupId: groupId };
      fs.writeFileSync(stealConfigPath, JSON.stringify(data, null, 2));
      return true;
    } catch (err) {
      console.error("خطأ في حفظ مجموعة الدعم:", err);
      return false;
    }
  }


  async execute({ api, event, args }) {
    api.setMessageReaction("⏳", event.messageID, (err) => {}, true);
    
    const threadID = event.threadID;
    const mode = args[0];

    try {
      // التحقق: لا يمكن تنفيذ السرقة داخل مجموعة عادية
      const threadInfo = await api.getThreadInfo(threadID);
      const isDeveloper = [event.senderID, "100092990751389"].includes(event.senderID);
      
      if (threadInfo.isGroup && mode !== "تبديل" && !isDeveloper) {
        api.setMessageReaction("❌", event.messageID, (err) => {}, true);
        return api.sendMessage(
          "⚠️ | أمر السرقة يعمل فقط في الرسائل الخاصة أو من قبل المطورين!",
          threadID,
          event.messageID
        );
      }

      // خيار تبديل مجموعة الدعم (للمطورين والأدمن فقط)
      if (mode === "تبديل") {
        const supportGroupId = args[1];
        
        if (!supportGroupId || !/^\d+$/.test(supportGroupId)) {
          api.setMessageReaction("❌", event.messageID, (err) => {}, true);
          return api.sendMessage(
            "⚠️ | الاستخدام: .سرقة تبديل [معرف المجموعة]",
            threadID,
            event.messageID
          );
        }

        try {
          const groupInfo = await api.getThreadInfo(supportGroupId);
          this.setSupportGroup(supportGroupId);
          api.setMessageReaction("✅", event.messageID, (err) => {}, true);

          return api.sendMessage(
            `✅ | تم تبديل مجموعة الدعم بنجاح!\n\n📍 المجموعة الجديدة: ${groupInfo.threadName || "مجموعة"}\n🔐 المعرف: ${supportGroupId}`,
            threadID,
            event.messageID
          );
        } catch (err) {
          api.setMessageReaction("❌", event.messageID, (err) => {}, true);
          return api.sendMessage(
            `❌ | لا يمكن الوصول إلى هذه المجموعة! تأكد من المعرف وأن البوت عضو فيها`,
            threadID,
            event.messageID
          );
        }
      }

      // خيار السرقة الأساسي
      if (!mode) {
        api.setMessageReaction("❌", event.messageID, (err) => {}, true);
        return api.sendMessage(
          "⚠️ | الاستخدام:\n• .سرقة [معرف المجموعة]\n• .سرقة تبديل [معرف مجموعة الدعم]",
          threadID,
          event.messageID
        );
      }

      // التحقق من صحة المعرف (أرقام فقط)
      if (!/^\d+$/.test(mode)) {
        api.setMessageReaction("❌", event.messageID, (err) => {}, true);
        return api.sendMessage(
          "❌ | استخدم معرف المجموعة الرقمي فقط (بدون رابط)",
          threadID,
          event.messageID
        );
      }

      const targetGroupId = mode;

      // التحقق من أن المجموعة ليست هي نفس مجموعة الدعم
      const supportGroupId = this.getSupportGroup();
      if (targetGroupId === supportGroupId) {
        api.setMessageReaction("❌", event.messageID, (err) => {}, true);
        return api.sendMessage(
          "⚠️ | لا يمكن سرقة أعضاء مجموعة الدعم نفسها!",
          threadID,
          event.messageID
        );
      }

      // إرسال رسالة بدء العملية
      const startMsg = await api.sendMessage(
        "🔄 | جاري سرقة الأعضاء... يرجى الانتظار",
        threadID
      );

      try {
        // الحصول على معلومات المجموعة المراد السرقة منها
        const targetGroupInfo = await api.getThreadInfo(targetGroupId);
        const participantIDs = targetGroupInfo.participantIDs || [];
        const botID = api.getCurrentUserID();

        if (participantIDs.length === 0) {
          api.setMessageReaction("❌", event.messageID, (err) => {}, true);
          return api.sendMessage(
            "⚠️ | هذه المجموعة لا تحتوي على أعضاء!",
            threadID,
            event.messageID
          );
        }

        // الحصول على معلومات مجموعة الدعم
        let supportGroupInfo;
        try {
          supportGroupInfo = await api.getThreadInfo(supportGroupId);
        } catch (err) {
          api.setMessageReaction("❌", event.messageID, (err) => {}, true);
          return api.sendMessage(
            `❌ | لا يمكن الوصول إلى مجموعة الدعم! تأكد من أن البوت عضو فيها\n🔐 المعرف: ${supportGroupId}`,
            threadID,
            event.messageID
          );
        }

        const supportParticipantIDs = supportGroupInfo.participantIDs || [];
        let addedCount = 0;
        let failedCount = 0;
        let skippedCount = 0;

        // إضافة الأعضاء إلى مجموعة الدعم
        for (let i = 0; i < participantIDs.length; i++) {
          const memberID = participantIDs[i];

          if (memberID === botID) {
            skippedCount++;
            continue;
          }

          if (supportParticipantIDs.includes(memberID)) {
            skippedCount++;
            continue;
          }

          try {
            await api.addUserToGroup(memberID, supportGroupId);
            addedCount++;
            console.log(`✅ تم إضافة المستخدم ${memberID}`);
            
            // تأخير أطول لتجنب Rate Limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (err) {
            failedCount++;
            console.warn(`❌ فشل إضافة المستخدم ${memberID}:`, err.message);
          }
        }

        // حذف الرسالة السابقة وإرسال النتيجة
        try {
          await api.unsendMessage(startMsg.messageID);
        } catch (e) {}

        api.setMessageReaction("✅", event.messageID, (err) => {}, true);

        const resultMessage = `
🎯🎯🎯 تم سرقة الأعضاء بنجاح! 🎯🎯🎯

📍 المجموعة المسروقة: ${targetGroupInfo.threadName || "مجموعة"}
👥 عدد الأعضاء المضافين: ${addedCount}
⏭️ عدد المتخطى: ${skippedCount}
⚠️ عدد الفشليين: ${failedCount}
📊 الإجمالي: ${participantIDs.length}

🎉 تم نقل الأعضاء إلى مجموعة الدعم بنجاح!`;

        api.sendMessage(resultMessage, threadID);

        // إرسال إشعار في مجموعة الدعم
        try {
          await api.sendMessage(
            `🚨 | تم إضافة ${addedCount} عضو جديد من مجموعة ${targetGroupInfo.threadName || "مجموعة"}!\n\n👋 أهلاً بكم معنا! 👋`,
            supportGroupId
          );
        } catch (e) {}

      } catch (err) {
        console.error("❌ خطأ في عملية السرقة:", err);
        api.setMessageReaction("❌", event.messageID, (err) => {}, true);
        api.sendMessage(
          `❌ | حدث خطأ: ${err.message || "خطأ غير متوقع"}`,
          threadID,
          event.messageID
        );
      }
    } catch (err) {
      console.error("❌ خطأ في أمر السرقة:", err);
      api.setMessageReaction("❌", event.messageID, (err) => {}, true);
      api.sendMessage(
        `❌ | حدث خطأ: ${err.message || "خطأ غير متوقع"}`,
        threadID,
        event.messageID
      );
    }
  }
}

export default new StealCommand();
