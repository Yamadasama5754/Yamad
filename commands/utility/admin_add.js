class ادخلني {
  constructor() {
    this.name = "ادخلني";
    this.aliases = ["joinme", "ادخال"];
    this.description = "يعرض المجموعات التي فيها البوت ويضيفك إليها حسب اختيارك.";
    this.cooldowns = 5;
    this.role = 2;
    this.version = "2.4";
    this.author = "Yamada KJ & Alastor";
  }

  async execute({ api, event }) {
    const senderID = event.senderID;
    const threadID = event.threadID;

    try {
      const allThreads = await api.getThreadList(100, null, ["INBOX"]);
      const groupThreads = allThreads.filter(t => t.isGroup && t.name);

      if (groupThreads.length === 0) {
        return api.sendMessage("❌ | لا توجد مجموعات يمكن الانضمام إليها.", threadID);
      }

      const limitedGroups = groupThreads.slice(0, 20);

      let list = "📋 | اختر رقم المجموعة التي تريد الانضمام إليها:\n\n";
      limitedGroups.forEach((group, index) => {
        list += `${index + 1}. ${group.name} (${group.threadID})\n`;
      });

      list += "\n📝 | رد على هذه الرسالة برقم المجموعة.";

      api.sendMessage(list, threadID, (err, info) => {
        if (err) return;

        // ✅ سجل الرد
        global.client.handler.reply.set(info.messageID, {
          name: this.name,
          author: senderID,
          groups: limitedGroups,
          unsend: true // نحذف رسالة القائمة عند الرد
        });
      });
    } catch (err) {
      console.error("❌ خطأ في أمر ادخلني:", err);
      api.sendMessage("⚠️ | حدث خطأ أثناء جلب المجموعات.", threadID);
    }
  }

  async onReply({ api, event, reply }) {
    const { author, groups } = reply;
    const senderID = event.senderID;
    const threadID = event.threadID;

    // ✅ الرد فقط لصاحب الأمر
    if (senderID !== author) {
      return api.sendMessage("🚫 | هذا الرد مخصص لصاحب الأمر فقط.", threadID);
    }

    const choice = parseInt(event.body);
    if (isNaN(choice) || choice < 1 || choice > groups.length) {
      return api.sendMessage("❌ | رقم غير صالح. حاول مرة أخرى.", threadID);
    }

    const selectedGroup = groups[choice - 1];

    try {
      const threadInfo = await api.getThreadInfo(selectedGroup.threadID);
      const botID = api.getCurrentUserID();

      // ✅ حذف رسالة القائمة فور الرد
      api.unsendMessage(event.messageReply.messageID);

      if (!threadInfo.participantIDs.includes(botID)) {
        return api.sendMessage("❌ | لا أستطيع إضافتك، لأنني لست موجودًا في هذه المجموعة.", threadID);
      }

      if (threadInfo.participantIDs.includes(senderID)) {
        return api.sendMessage("⚠️ | أنت بالفعل موجود في هذه المجموعة.", threadID);
      }

      const isBotAdmin = threadInfo.adminIDs.some(admin => admin.id === botID);
      if (!isBotAdmin) {
        return api.sendMessage("⚠️ | لم أستطع إضافتك، البوت ليس أدمن في هذه المجموعة.", threadID);
      }

      await api.addUserToGroup(senderID, selectedGroup.threadID);
      api.sendMessage(`✅ | تم إضافتك إلى المجموعة: ${selectedGroup.name}`, threadID);

      // ✅ حذف بيانات الرد بعد الاستخدام
      global.client.handler.reply.delete(event.messageReply.messageID);
    } catch (err) {
      console.error("❌ فشل في الإضافة:", err);
      api.sendMessage("❌ | لم أستطع إضافتك. قد تكون الإضافة ممنوعة أو حدث خطأ.", threadID);
    }
  }
}

export default new ادخلني();