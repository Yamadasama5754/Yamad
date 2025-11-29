import fs from "fs";

const stealConfigPath = "KaguyaSetUp/stealConfig.json";

class StealCommand {
  constructor() {
    this.name = "سرقة";
    this.author = "Yamada KJ & Alastor";
    this.role = 1;
    this.description = "سرقة جميع أعضاء مجموعة وإضافتهم إلى مجموعة دعم | استخدام: سرقة [معرف/رابط] | سرقة تبديل [معرف المجموعة]";
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

  parseGroupId(input) {
    if (!input) return null;
    
    // إذا كان رقم مباشر
    if (/^\d+$/.test(input)) {
      return input;
    }

    // محاولة استخراج ID من رابط Facebook
    const match = input.match(/facebook\.com\/groups\/(\d+)/);
    if (match) {
      return match[1];
    }

    // محاولة أخرى للرابط
    const match2 = input.match(/groups\/(\d+)/);
    if (match2) {
      return match2[1];
    }

    return null;
  }

  async execute({ api, event, args }) {
    const threadID = event.threadID;
    const mode = args[0];

    try {
      // خيار تبديل مجموعة الدعم
      if (mode === "تبديل") {
        const supportGroupId = args[1];
        
        if (!supportGroupId) {
          return api.sendMessage(
            "⚠️ | الاستخدام: .سرقة تبديل [معرف المجموعة أو الرابط]",
            threadID,
            event.messageID
          );
        }

        const parsedId = this.parseGroupId(supportGroupId);
        if (!parsedId) {
          return api.sendMessage(
            "❌ | معرف المجموعة غير صحيح! استخدم ID أو رابط Facebook صحيح",
            threadID,
            event.messageID
          );
        }

        try {
          const groupInfo = await api.getThreadInfo(parsedId);
          this.setSupportGroup(parsedId);

          return api.sendMessage(
            `✅ | تم تبديل مجموعة الدعم بنجاح!\n\n📍 المجموعة الجديدة: ${groupInfo.threadName || "مجموعة"}\n🔐 المعرف: ${parsedId}`,
            threadID,
            event.messageID
          );
        } catch (err) {
          return api.sendMessage(
            `❌ | لا يمكن الوصول إلى هذه المجموعة! تأكد من المعرف وأن البوت عضو فيها`,
            threadID,
            event.messageID
          );
        }
      }

      // خيار السرقة الأساسي
      if (!mode) {
        return api.sendMessage(
          "⚠️ | الاستخدام:\n• .سرقة [معرف المجموعة أو الرابط]\n• .سرقة تبديل [معرف مجموعة الدعم]",
          threadID,
          event.messageID
        );
      }

      // السرقة من المجموعة المحددة
      const targetGroupId = this.parseGroupId(mode);
      if (!targetGroupId) {
        return api.sendMessage(
          "❌ | معرف المجموعة غير صحيح! استخدم ID أو رابط Facebook صحيح",
          threadID,
          event.messageID
        );
      }

      // التحقق من أن المجموعة ليست هي نفس مجموعة الدعم
      const supportGroupId = this.getSupportGroup();
      if (targetGroupId === supportGroupId) {
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
          return api.sendMessage(
            `❌ | لا يمكن الوصول إلى مجموعة الدعم! تأكد من أن البوت عضو فيها\n🔐 المعرف: ${supportGroupId}`,
            threadID,
            event.messageID
          );
        }

        const supportParticipantIDs = supportGroupInfo.participantIDs || [];
        let addedCount = 0;
        let failedCount = 0;

        // إضافة الأعضاء إلى مجموعة الدعم
        for (const memberID of participantIDs) {
          if (memberID === botID) continue; // تخطي البوت
          if (supportParticipantIDs.includes(memberID)) continue; // تخطي من هم بالفعل في المجموعة

          try {
            await api.addUserToGroup(memberID, supportGroupId);
            addedCount++;
            await new Promise(resolve => setTimeout(resolve, 500)); // تأخير لتجنب Rate Limiting
          } catch (err) {
            failedCount++;
            console.warn(`⚠️ فشل إضافة المستخدم ${memberID}:`, err.message);
          }
        }

        // حذف الرسالة السابقة وإرسال النتيجة
        try {
          await api.unsendMessage(startMsg.messageID);
        } catch (e) {}

        const resultMessage = `
🎯🎯🎯 تم سرقة الأعضاء بنجاح! 🎯🎯🎯

📍 المجموعة المسروقة: ${targetGroupInfo.threadName || "مجموعة"}
👥 عدد الأعضاء المضافين: ${addedCount}
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
        api.sendMessage(
          `❌ | حدث خطأ: ${err.message || "خطأ غير متوقع"}`,
          threadID,
          event.messageID
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
