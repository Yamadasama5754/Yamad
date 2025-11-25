class PurgeCommand {
  constructor() {
    this.name = "تصفية";
    this.author = "Yamada KJ & Alastor";
    this.cooldowns = 300;
    this.description = "يصفي الحسابات المتبنده من المجموعه أو عرض قائمة الأوامر";
    this.role = 1;
    this.aliases = ["تصفية", "purge"];
  }

  async execute({ api, event, args }) {
    try {
      const action = args[0]?.toLowerCase();

      // ===== ميزة قائمة الأوامر =====
      if (action === "قائمة") {
        const page = parseInt(args[1]) || 1;
        const itemsPerPage = 10;

        if (!global.client.commands || global.client.commands.size === 0) {
          return api.sendMessage("❌ لا توجد أوامر مسجلة!", event.threadID);
        }

        const allCommands = Array.from(global.client.commands.values());
        const totalPages = Math.ceil(allCommands.length / itemsPerPage);

        if (page < 1 || page > totalPages) {
          return api.sendMessage(
            `❌ الصفحة ${page} غير موجودة!\n📄 العدد الكلي من الصفحات: ${totalPages}`,
            event.threadID
          );
        }

        const startIdx = (page - 1) * itemsPerPage;
        const endIdx = startIdx + itemsPerPage;
        const pageCommands = allCommands.slice(startIdx, endIdx);

        let msg = `📋 قائمة الأوامر (صفحة ${page}/${totalPages})\n━━━━━━━━━━━━━━━━━━━━\n\n`;
        pageCommands.forEach((cmd) => {
          // إضافة إيموجي بناءً على الدور
          let roleEmoji = "✨"; // للجميع
          if (cmd.role === 2) {
            roleEmoji = "🔑"; // مطور فقط
          } else if (cmd.role === 1) {
            roleEmoji = "👑"; // أدمن فقط
          }
          
          msg += `${roleEmoji} ${cmd.name} - ${cmd.description || "بدون وصف"}\n`;
        });

        msg += `\n━━━━━━━━━━━━━━━━━━━━\n`;
        msg += `💡 لعرض صفحة أخرى: .تصنيف قائمة [رقم الصفحة]`;

        return api.sendMessage(msg, event.threadID, event.messageID);
      }

      // ===== الميزة الأصلية: تصفية الحسابات المتبندة =====
      api.setMessageReaction("⏳", event.messageID, (err) => {}, true);

      const threadInfo = await api.getThreadInfo(event.threadID);
      const { userInfo, adminIDs } = threadInfo;
      
      // التحقق من أن البوت أدمن قبل أي شيء
      const botID = api.getCurrentUserID();
      const isBotAdmin = adminIDs.some(admin => admin.id === botID);

      if (!isBotAdmin) {
        api.setMessageReaction("❌", event.messageID, (err) => {}, true);
        return api.sendMessage("❌ | البوت يجب أن يكون أدمن لاستخدام هذا الأمر. ارفعني ادمن وهشتغل لوحدي! 🙏", event.threadID);
      }

      // البحث عن الحسابات المتبنده (التي ليس لها gender)
      let success = 0, fail = 0;
      const ghostAccounts = [];

      for (const user of userInfo) {
        if (user.gender === undefined) {
          ghostAccounts.push(user.id);
        }
      }

      // التحقق من وجود حسابات للتصفية
      if (ghostAccounts.length === 0) {
        api.setMessageReaction("✅", event.messageID, (err) => {}, true);
        return api.sendMessage("✅ | مافي حسابات طايرة بالمجموعة. المجموعة نظيفة! 🎉", event.threadID);
      }

      // بدء التصفية
      api.sendMessage(
        `📊 | وجدت ${ghostAccounts.length} حساب طائر بالجروب.\n⏳ جاري التصفية...`,
        event.threadID,
        async (err, info) => {
          if (err) return;

          // تصفية الحسابات
          for (const userID of ghostAccounts) {
            try {
              await new Promise(resolve => setTimeout(resolve, 1000));
              await api.removeUserFromGroup(parseInt(userID), event.threadID);
              success++;
            } catch (error) {
              console.error(`فشل في طرد ${userID}:`, error);
              fail++;
            }
          }

          // إرسال النتيجة
          let resultMsg = `✨ | تمت التصفية بنجاح!\n\n`;
          resultMsg += `✅ تم طرد ${success} حساب طائر\n`;
          if (fail > 0) {
            resultMsg += `⚠️ فشل طرد ${fail} حساب\n`;
          }
          resultMsg += `\n🎯 المجموعة الآن أنظف! 🧹`;

          api.sendMessage(resultMsg, event.threadID);
          api.unsendMessage(info.messageID);
          api.setMessageReaction("✅", event.messageID, (err) => {}, true);
        }
      );

    } catch (error) {
      console.error("خطأ في أمر التصفية:", error);
      api.setMessageReaction("❌", event.messageID, (err) => {}, true);
      api.sendMessage("❌ | حدث خطأ أثناء تنفيذ الأمر!", event.threadID);
    }
  }
}

export default new PurgeCommand();
