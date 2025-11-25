import axios from 'axios';
import fs from 'fs';
import path from 'path';

class Help {
  constructor() {
    this.name = "مساعدة";
    this.author = "Yamada KJ & Alastor";
    this.cooldowns = 5;
    this.description = "عرض قائمة الأوامر أو معلومات عن أمر معين";
    this.role = 0;
    this.aliases = ["help", "اوامر", "أوامر", "الاوامر"];
    this.commands = global.client.commands;
  }

  getRoleDescription(role) {
    const roles = {
      0: "👥 للجميع",
      1: "👑 للأدمن والمطورين",
      2: "⚙️ للمطورين فقط"
    };
    return roles[role] || "غير محدد";
  }

  async execute({ api, event, args }) {
    try {
      const allCommands = Array.from(this.commands.values());
      const commandList = allCommands.filter(cmd => !cmd.hidden);
      const commandsPerPage = 20;
      const totalPages = Math.ceil(commandList.length / commandsPerPage);
      const totalCommands = commandList.length;

      // بدون arguments - اعرض الصفحة الأولى
      if (args.length === 0) {
        let msg = `\n•—[قــائــمــة أوامــر ميراي]—•\n`;
        const commandsToDisplay = commandList.slice(0, commandsPerPage);
        commandsToDisplay.forEach((command, index) => {
          msg += `[${index + 1}] ⟻『${command.name}』\n`;
        });

        msg += `\n✎﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏✎\n` +
               `📜 الصفحة: 1/${totalPages}\n` +
               `🪐 إجمالي عدد الأوامر: ${totalCommands} أمر\n` +
               `🔖 | اكتب 'مساعدة رقم الصفحة' لرؤية الصفحات الأخرى.\n` +
               `🧵 | اكتب 'مساعدة الكل' لرؤية جميع الأوامر.`;

        return await api.sendMessage(msg, event.threadID);
      }

      const pageStr = args[0];

      // اعرض جميع الأوامر
      if (pageStr === 'الكل') {
        let allCommandsMsg = "╭───────────────◊\n•——[قائمة جميع الأوامر]——•\n";
        
        commandList.forEach((command) => {
          const commandName = command.name;
          allCommandsMsg += `❏ الإسم : 『${commandName}』\n`;
        });

        allCommandsMsg += `إجمالي عدد الأوامر: ${totalCommands} أمر\n╰───────────────◊`;
        return await api.sendMessage(allCommandsMsg, event.threadID);
      }

      // اعرض صفحة معينة (إذا كان رقم)
      if (!isNaN(pageStr) && parseInt(pageStr) > 0) {
        const page = parseInt(pageStr);
        
        if (page > totalPages) {
          return api.sendMessage("❌ الصفحة غير موجودة", event.threadID);
        }

        const startIndex = (page - 1) * commandsPerPage;
        const endIndex = page * commandsPerPage;

        let msg = `\n•—[قــائــمــة أوامــر ميراي]—•\n`;
        const commandsToDisplay = commandList.slice(startIndex, endIndex);
        
        commandsToDisplay.forEach((command, index) => {
          const commandNumber = startIndex + index + 1;
          msg += `[${commandNumber}] ⟻『${command.name}』\n`;
        });

        msg += `\n✎﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏✎\n` +
               `📜 الصفحة: ${page}/${totalPages}\n` +
               `🪐 إجمالي عدد الأوامر: ${totalCommands} أمر\n` +
               `🔖 | اكتب 'مساعدة رقم الصفحة' لرؤية الصفحات الأخرى.\n` +
               `🧵 | اكتب 'مساعدة الكل' لرؤية جميع الأوامر.`;

        return await api.sendMessage(msg, event.threadID);
      }

      // ابحث عن أمر معين
      const searchName = args.join(" ");
      const command = commandList.find(
        cmd => cmd.name === searchName || 
                cmd.name.toLowerCase() === searchName.toLowerCase() ||
                (cmd.aliases && cmd.aliases.some(alias => 
                  alias === searchName || 
                  alias.toLowerCase() === searchName.toLowerCase()
                ))
      );

      if (!command) {
        return api.sendMessage(`✨ اكتب: .مساعدة 1`, event.threadID);
      }

      // عرض معلومات الأمر
      const roleDesc = this.getRoleDescription(command.role);
      const aliases = command.aliases && command.aliases.length > 0 
        ? command.aliases.join(", ") 
        : "لا توجد";
      
      let infoMsg = `📖 | معلومات الأمر\n`;
      infoMsg += `═══════════════════════\n`;
      infoMsg += `📌 اسم الأمر: ${command.name}\n`;
      infoMsg += `ℹ️ الوصف: ${command.description}\n`;
      infoMsg += `👤 الدور المطلوب: ${roleDesc}\n`;
      infoMsg += `⏱️ فترة الانتظار: ${command.cooldowns || 0} ثانية\n`;
      infoMsg += `🔗 الأسماء البديلة: ${aliases}\n`;
      infoMsg += `👨‍💻 صاحب الأمر: ${command.author || "غير محدد"}\n`;
      infoMsg += `═══════════════════════\n`;

      return await api.sendMessage(infoMsg, event.threadID);

    } catch (err) {
      console.error("❌ خطأ في أمر المساعدة:", err);
      return api.sendMessage(`❌ خطأ: ${err.message}`, event.threadID);
    }
  }
}

export default new Help();
