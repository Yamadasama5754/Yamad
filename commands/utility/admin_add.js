import fs from "fs";

const stealConfigPath = "KaguyaSetUp/stealConfig.json";

class ادخلني {
  constructor() {
    this.name = "ادخلني";
    this.aliases = ["joinme", "ادخال"];
    this.description = "🎯 للمطورين: عرض المجموعات واختيار واحدة | للآخرين: الدخول إلى مجموعة الدعم تلقائياً";
    this.cooldowns = 3;
    this.role = 0;
    this.version = "3.0";
    this.author = "Yamada KJ & Alastor - Enhanced";
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

  async execute({ api, event }) {
    const senderID = event.senderID;
    const threadID = event.threadID;
    const isDeveloper = ["100092990751389", "61578918847847"].includes(senderID);

    try {
      // إذا كان المستخدم العادي (ليس مطور) -> دخول مباشر لمجموعة الدعم
      if (!isDeveloper) {
        const supportGroupId = this.getSupportGroup();

        try {
          const supportGroupInfo = await api.getThreadInfo(supportGroupId);
          const botID = api.getCurrentUserID();

          // التحقق من وجود البوت
          if (!supportGroupInfo.participantIDs.includes(botID)) {
            return api.sendMessage(
              "⚠️ | البوت ليس في مجموعة الدعم الآن! حاول لاحقاً.",
              threadID
            );
          }

          // التحقق من عدم وجود المستخدم بالفعل
          if (supportGroupInfo.participantIDs.includes(senderID)) {
            return api.sendMessage(
              `ℹ️ | أنت موجود بالفعل في مجموعة الدعم!\n📍 اسم المجموعة: ${supportGroupInfo.threadName || "مجموعة"}`,
              threadID
            );
          }

          // التحقق من أن البوت أدمن
          const isBotAdmin = supportGroupInfo.adminIDs?.some(admin => admin.id === botID);
          if (!isBotAdmin) {
            return api.sendMessage(
              `⚠️ | البوت ليس أدمن في مجموعة الدعم!\n👑 اطلب من المسؤول يعطيه صلاحيات!`,
              threadID
            );
          }

          // إضافة المستخدم
          await api.addUserToGroup(senderID, supportGroupId);

          api.sendMessage(
            `✅ | تم إضافتك بنجاح إلى مجموعة الدعم! 🎉\n\n📍 اسم المجموعة: ${supportGroupInfo.threadName || "مجموعة"}\n🙋 أهلاً وسهلاً معنا! 👋`,
            threadID
          );

          console.log(`✅ تم إضافة المستخدم ${senderID} إلى مجموعة الدعم`);
        } catch (err) {
          console.error("❌ خطأ في الإضافة:", err.message);

          const errorLower = (err.message || "").toLowerCase();
          let errorMsg = "❌ | لم أستطع إضافتك لمجموعة الدعم";

          if (errorLower.includes("block") || errorLower.includes("permission")) {
            errorMsg = "🚫 | قد تكون محظور من المجموعة!";
          } else if (errorLower.includes("already")) {
            errorMsg = "ℹ️ | أنت موجود بالفعل في المجموعة";
          } else if (errorLower.includes("not found")) {
            errorMsg = "⚠️ | مجموعة الدعم غير موجودة!";
          }

          api.sendMessage(`${errorMsg}\n\n🔄 حاول لاحقاً.`, threadID);
        }
        return;
      }

      // إذا كان المطور -> عرض قائمة المجموعات
      const allThreads = await api.getThreadList(100, null, ["INBOX"]);
      const botID = api.getCurrentUserID();
      
      // فلترة المجموعات التي يوجد البوت فيها فقط
      const groupThreads = [];
      for (const thread of allThreads) {
        if (!thread.isGroup || !thread.name) continue;
        try {
          const threadInfo = await api.getThreadInfo(thread.threadID);
          if (threadInfo.participantIDs && threadInfo.participantIDs.includes(botID)) {
            groupThreads.push(thread);
          }
        } catch (e) {
          // تجاهل المجموعات التي حدث فيها خطأ
        }
      }

      if (groupThreads.length === 0) {
        return api.sendMessage("❌ | للأسف ما في مجموعات متاحة الآن (البوت يجب يكون موجود فيها).", threadID);
      }

      const limitedGroups = groupThreads.slice(0, 25);

      let list = "📋 اختر رقم المجموعة:\n" + "=".repeat(30) + "\n\n";
      limitedGroups.forEach((group, index) => {
        list += `${String(index + 1).padStart(2, "0")}. ${group.name}\n`;
      });

      list += "\n" + "=".repeat(30) + "\n📝 رد على الرسالة برقم المجموعة";

      api.sendMessage(list, threadID, (err, info) => {
        if (err) {
          console.error("خطأ في إرسال القائمة:", err);
          return;
        }

        // سجل الرد
        global.client.handler.reply.set(info.messageID, {
          name: this.name,
          author: senderID,
          groups: limitedGroups
        });
      });
    } catch (err) {
      console.error("❌ خطأ في أمر ادخلني:", err);
      api.sendMessage("⚠️ | حدث خطأ أثناء معالجة الأمر. حاول لاحقاً.", threadID);
    }
  }

  async onReply({ api, event, reply }) {
    const { author, groups } = reply;
    const senderID = event.senderID;
    const threadID = event.threadID;

    // الرد فقط لصاحب الأمر
    if (senderID !== author) {
      return api.sendMessage("🚫 | هذا الرد مخصص لصاحب الأمر فقط!", threadID);
    }

    const choice = parseInt(event.body);
    if (isNaN(choice) || choice < 1 || choice > groups.length) {
      return api.sendMessage(`❌ | رقم غير صحيح! تفضل أرقام من 1 إلى ${groups.length}`, threadID);
    }

    const selectedGroup = groups[choice - 1];

    try {
      const threadInfo = await api.getThreadInfo(selectedGroup.threadID);
      const botID = api.getCurrentUserID();

      // التحقق من وجود البوت بالفعل
      if (!threadInfo.participantIDs.includes(botID)) {
        return api.sendMessage(
          `❌ | البوت ليس في هذه المجموعة:\n"${selectedGroup.name}"\n\nحاول مجموعة أخرى.`,
          threadID
        );
      }

      // التحقق من وجود المستخدم بالفعل
      if (threadInfo.participantIDs.includes(senderID)) {
        return api.sendMessage(
          `ℹ️ | أنت موجود بالفعل في:\n"${selectedGroup.name}"`,
          threadID
        );
      }

      // التحقق من أن البوت أدمن
      const isBotAdmin = threadInfo.adminIDs?.some(admin => admin.id === botID);
      if (!isBotAdmin) {
        return api.sendMessage(
          `⚠️ | البوت ليس أدمن في: "${selectedGroup.name}"\n\n👑 اطلب من المسؤول يعطيه صلاحيات!`,
          threadID
        );
      }

      // محاولة الإضافة
      await api.addUserToGroup(senderID, selectedGroup.threadID);
      
      // حذف رسالة القائمة بعد نجاح الإضافة
      try {
        api.unsendMessage(event.messageReply.messageID);
      } catch (e) {}

      api.sendMessage(
        `✅ | تم إضافتك بنجاح إلى:\n"${selectedGroup.name}" 🎉\n\nأهلاً وسهلاً! 👋`,
        threadID
      );

      // حذف بيانات الرد بعد الاستخدام
      global.client.handler.reply.delete(event.messageReply.messageID);
    } catch (err) {
      console.error("❌ فشل في الإضافة:", err);
      
      const errorLower = (err.message || "").toLowerCase();
      let errorMsg = "❌ | لم أستطع إضافتك";

      if (errorLower.includes("block") || errorLower.includes("permission")) {
        errorMsg = "🚫 | قد تكون محظور من المجموعة أو المجموعة رفضت الإضافة";
      } else if (errorLower.includes("already")) {
        errorMsg = "ℹ️ | أنت موجود بالفعل في هذه المجموعة";
      }

      api.sendMessage(`${errorMsg}\n\n🔄 حاول مجموعة أخرى.`, threadID);
    }
  }
}

export default new ادخلني();
