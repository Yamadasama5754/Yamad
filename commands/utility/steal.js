import fs from "fs";

const stealConfigPath = "KaguyaSetUp/stealConfig.json";

class StealCommand {
  constructor() {
    this.name = "سرقة";
    this.author = "Yamada KJ & Alastor - Enhanced";
    this.role = 1;
    this.description = "سرقة أعضاء مجموعة | استخدام: سرقة [معرف] أو سرقة [رقم] [معرف] | سرقة تبديل [معرف]";
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

  // اختيار أعضاء عشوائيين من مصفوفة
  getRandomMembers(members, count) {
    const shuffled = [...members].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
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
          "⚠️ | الاستخدام:\n• .سرقة (من المجموعة الحالية - جميع الأعضاء)\n• .سرقة [عدد] (من المجموعة الحالية - عدد محدد)\n• .سرقة [معرف] (من مجموعة محددة)\n• .سرقة [عدد] [معرف] (عدد من مجموعة محددة)\n• .سرقة تبديل [معرف] (تبديل مجموعة الدعم)",
          threadID,
          event.messageID
        );
      }

      let targetGroupId;
      let stealCount = null;

      // التحقق: هل الأول رقم أم معرف؟
      if (/^\d+$/.test(mode)) {
        const firstNum = parseInt(mode);
        
        // إذا كان هناك args[1] (معرف ثاني)، فهذا يعني firstNum هو العدد والـ args[1] هو المعرف
        if (args[1]) {
          stealCount = firstNum;
          targetGroupId = args[1];

          // التحقق من صحة العدد
          if (stealCount <= 0) {
            api.setMessageReaction("❌", event.messageID, (err) => {}, true);
            return api.sendMessage(
              "❌ | اختر رقم أكبر من 0!",
              threadID,
              event.messageID
            );
          }

          // التحقق من صحة معرف المجموعة
          if (!/^\d+$/.test(targetGroupId)) {
            api.setMessageReaction("❌", event.messageID, (err) => {}, true);
            return api.sendMessage(
              "❌ | معرف المجموعة يجب أن يكون أرقام فقط",
              threadID,
              event.messageID
            );
          }
        } else {
          // إذا كان الرقم قصير (أقل من 10 أرقام)، اعتبره عدد من المجموعة الحالية
          // إذا كان طويل (10 أرقام أو أكثر)، اعتبره معرف مجموعة
          if (mode.length < 10) {
            // رقم قصير = عدد الأعضاء من المجموعة الحالية
            stealCount = firstNum;
            targetGroupId = threadID;

            if (stealCount <= 0) {
              api.setMessageReaction("❌", event.messageID, (err) => {}, true);
              return api.sendMessage(
                "❌ | اختر رقم أكبر من 0!",
                threadID,
                event.messageID
              );
            }
          } else {
            // رقم طويل = معرف المجموعة
            targetGroupId = mode;
          }
        }
      } else {
        api.setMessageReaction("❌", event.messageID, (err) => {}, true);
        return api.sendMessage(
          "❌ | استخدم أرقام فقط للمعرف (بدون رابط)",
          threadID,
          event.messageID
        );
      }

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
        let targetGroupInfo;
        try {
          targetGroupInfo = await api.getThreadInfo(targetGroupId);
        } catch (err) {
          api.setMessageReaction("❌", event.messageID, (err) => {}, true);
          try {
            await api.unsendMessage(startMsg.messageID);
          } catch (e) {}
          return api.sendMessage(
            `❌ | لا يمكن الوصول إلى هذه المجموعة!\n🔐 تأكد من المعرف: ${targetGroupId}`,
            threadID,
            event.messageID
          );
        }

        if (!targetGroupInfo) {
          api.setMessageReaction("❌", event.messageID, (err) => {}, true);
          try {
            await api.unsendMessage(startMsg.messageID);
          } catch (e) {}
          return api.sendMessage(
            `❌ | معرف المجموعة غير صحيح أو غير موجود: ${targetGroupId}`,
            threadID,
            event.messageID
          );
        }

        let participantIDs = targetGroupInfo.participantIDs || [];
        const botID = api.getCurrentUserID();

        if (participantIDs.length === 0) {
          api.setMessageReaction("❌", event.messageID, (err) => {}, true);
          try {
            await api.unsendMessage(startMsg.messageID);
          } catch (e) {}
          return api.sendMessage(
            "⚠️ | هذه المجموعة لا تحتوي على أعضاء!",
            threadID,
            event.messageID
          );
        }

        // إذا كان هناك عدد محدد، اختر عشوائيين
        if (stealCount !== null) {
          if (stealCount > participantIDs.length) {
            api.setMessageReaction("❌", event.messageID, (err) => {}, true);
            try {
              await api.unsendMessage(startMsg.messageID);
            } catch (e) {}
            return api.sendMessage(
              `❌ | المجموعة لا تحتوي على ${stealCount} أعضاء!\n📊 عدد الأعضاء الموجود: ${participantIDs.length}`,
              threadID,
              event.messageID
            );
          }

          // اختيار عشوائي
          participantIDs = this.getRandomMembers(participantIDs, stealCount);
        }

        // الحصول على معلومات مجموعة الدعم
        let supportGroupInfo;
        try {
          supportGroupInfo = await api.getThreadInfo(supportGroupId);
        } catch (err) {
          api.setMessageReaction("❌", event.messageID, (err) => {}, true);
          try {
            await api.unsendMessage(startMsg.messageID);
          } catch (e) {}
          return api.sendMessage(
            `❌ | لا يمكن الوصول إلى مجموعة الدعم! تأكد من أن البوت عضو فيها\n🔐 المعرف: ${supportGroupId}`,
            threadID,
            event.messageID
          );
        }

        // التحقق من أن البوت عضو في مجموعة الدعم
        const supportAdminIDs = supportGroupInfo.adminIDs || [];
        const supportParticipantIDs = supportGroupInfo.participantIDs || [];
        
        if (!supportParticipantIDs.includes(botID)) {
          api.setMessageReaction("❌", event.messageID, (err) => {}, true);
          try {
            await api.unsendMessage(startMsg.messageID);
          } catch (e) {}
          return api.sendMessage(
            `❌ | البوت ليس عضو في مجموعة الدعم!\n🔐 تأكد من إضافة البوت أولاً`,
            threadID,
            event.messageID
          );
        }

        // التحقق من أن البوت عضو في المجموعة المسروقة
        if (!participantIDs.includes(botID)) {
          api.setMessageReaction("❌", event.messageID, (err) => {}, true);
          try {
            await api.unsendMessage(startMsg.messageID);
          } catch (e) {}
          return api.sendMessage(
            `❌ | البوت ليس عضو في المجموعة المسروقة!\n🔐 لا يمكن السرقة من مجموعة البوت ليس عضو فيها`,
            threadID,
            event.messageID
          );
        }

        let addedCount = 0;
        let failedCount = 0;
        let skippedCount = 0;
        const failedMembers = [];

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
            // استخدام callback بدلاً من await مع timeout
            await Promise.race([
              new Promise((resolve, reject) => {
                api.addUserToGroup(memberID, supportGroupId, (err) => {
                  if (err) {
                    reject(new Error(err.message || "فشل غير محدد"));
                  } else {
                    resolve();
                  }
                });
              }),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error("انتهت مهلة الوقت - قد يكون لدى المستخدم إعدادات خصوصية")), 3000)
              )
            ]);
            
            addedCount++;
            console.log(`✅ تم إضافة المستخدم ${memberID}`);
            
            // تأخير أطول لتجنب Rate Limiting
            await new Promise(resolve => setTimeout(resolve, 800));
          } catch (err) {
            failedCount++;
            failedMembers.push(memberID);
            console.warn(`❌ فشل إضافة المستخدم ${memberID}:`, err.message || "خطأ غير معروف");
          }
        }

        // حذف الرسالة السابقة وإرسال النتيجة
        try {
          await api.unsendMessage(startMsg.messageID);
        } catch (e) {}

        api.setMessageReaction("✅", event.messageID, (err) => {}, true);

        let resultMessage = `
🎯🎯🎯 نتيجة السرقة 🎯🎯🎯

📍 المجموعة المسروقة: ${targetGroupInfo.threadName || "مجموعة"}
👥 عدد الأعضاء المضافين: ${addedCount}
⏭️ عدد المتخطى: ${skippedCount}
⚠️ عدد الفشليين: ${failedCount}
📊 الإجمالي المختار: ${participantIDs.length}`;

        if (failedCount > 0) {
          resultMessage += `\n\n💡 تلميح: الأعضاء الذين فشل إضافتهم قد يكون لديهم:\n• إعدادات خصوصية تمنع الإضافة\n• حسابات معطلة أو محذوفة\n• حظر من البوت أو المجموعة`;
        }

        if (addedCount > 0) {
          resultMessage += `\n\n✅ تم نقل الأعضاء إلى مجموعة الدعم بنجاح!`;
        }

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
        try {
          await api.unsendMessage(startMsg.messageID);
        } catch (e) {}
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
        `❌ | حدث خطأ: ${err.message || "خطأ غير معروف"}`,
        threadID,
        event.messageID
      );
    }
  }
}

export default new StealCommand();
