class Classify {
  constructor() {
    this.name = "تصنيف";
    this.author = "Yamada KJ & Alastor";
    this.description = "تغيير صلاحية أي أمر (0 للجميع، 1 للأدمن، 2 للمطور).";
    this.aliases = ["classify"];
    this.role = 2; // 🔒 هذا الأمر للمطور فقط
  }

  async execute({ api, event, args }) {
    try {
      if (args.length < 2) {
        return api.sendMessage("⚠️ | استخدم: تصنيف <اسم الأمر> <0/1/2>", event.threadID, event.messageID);
      }

      const commandName = args[0].toLowerCase();
      const newRole = parseInt(args[1]);

      if (![0,1,2].includes(newRole)) {
        return api.sendMessage("⚠️ | الدور يجب أن يكون 0 أو 1 أو 2.", event.threadID, event.messageID);
      }

      const command = global.client.commands.get(commandName) || global.client.commands.get(global.client.aliases.get(commandName));
      if (!command) {
        return api.sendMessage(`❌ | لم أجد أمر باسم: ${commandName}`, event.threadID, event.messageID);
      }

      // ✅ تعديل الدور
      command.role = newRole;

      return api.sendMessage(
        `✅ | تم تغيير صلاحية الأمر "${commandName}" إلى ${newRole}.`,
        event.threadID,
        event.messageID
      );
    } catch (err) {
      console.log("❌ خطأ في أمر تصنيف:", err);
      return api.sendMessage("⚠️ | حصل خطأ أثناء محاولة تغيير التصنيف.", event.threadID, event.messageID);
    }
  }
}

export default new Classify();