import fs from "fs";
import path from "path";
import config from "../../KaguyaSetUp/config.js";

class AdminCommand {
  constructor() {
    this.name = "ادمن";
    this.author = "Yamada KJ & Alastor";
    this.cooldowns = 5;
    this.description = "إدارة الأدمنز (اضافة/ازالة/قائمة/تصفير) - يمكن الرد على رسالة الشخص";
    this.role = 2;
    this.aliases = ["admin"];
  }

  async execute({ api, event, args = [] }) {
    try {
      // تحقق أن المنفذ هو المطور فقط
      if (event.senderID !== "100092990751389") {
        return api.sendMessage("⛔ | هذا الأمر مخصص لصاحب البوت فقط.", event.threadID, event.messageID);
      }

      const admins = config.ADMIN_IDS;
      const sub = args[0];

      if (!sub) {
        return api.sendMessage(
          "⚠️ | استخدم:\nادمن اضافة (رد على رسالة أو اكتب أيدي)\nادمن حذف (رد على رسالة أو اكتب أيدي)\nادمن قائمة\nادمن تصفير",
          event.threadID,
          event.messageID
        );
      }

      if (sub === "اضافة") {
        let targetID = event.messageReply?.senderID || args[1];
        if (!targetID) return api.sendMessage("⚠️ | رد على رسالة الشخص أو اكتب أيدي بعد الأمر.\n💡 مثال: .ادمن اضافة 123456789", event.threadID, event.messageID);

        if (!admins.includes(targetID)) {
          admins.push(targetID);
          config.ADMIN_IDS = admins;
          fs.writeFileSync(
            path.join(process.cwd(), "KaguyaSetUp/config.js"),
            `export default ${JSON.stringify(config, null, 2)};`
          );
          await api.sendMessage(`✅ | تم إضافة ${targetID} كأدمن.`, event.threadID, event.messageID);
        } else {
          await api.sendMessage("⚠️ | هذا الشخص بالفعل أدمن.", event.threadID, event.messageID);
        }
      }

      else if (sub === "ازالة") {
        let targetID = event.messageReply?.senderID || args[1];
        if (!targetID) return api.sendMessage("⚠️ | رد على رسالة الشخص أو اكتب أيدي بعد الأمر.\n💡 مثال: .ادمن حذف 123456789", event.threadID, event.messageID);

        const index = admins.indexOf(targetID);
        if (index > -1) {
          admins.splice(index, 1);
          config.ADMIN_IDS = admins;
          fs.writeFileSync(
            path.join(process.cwd(), "KaguyaSetUp/config.js"),
            `export default ${JSON.stringify(config, null, 2)};`
          );
          await api.sendMessage(`❌ | تم حذف ${targetID} من الأدمنز.`, event.threadID, event.messageID);
        } else {
          await api.sendMessage("⚠️ | هذا الشخص مش موجود في قائمة الأدمنز.", event.threadID, event.messageID);
        }
      }

      else if (sub === "قائمة") {
        if (admins.length === 0) {
          return api.sendMessage("⚠️ | ما فيه أي أدمن مسجل.", event.threadID, event.messageID);
        }
        const list = admins.map((id, i) => `${i + 1}. ${id}`).join("\n");
        await api.sendMessage(`👑 | قائمة الأدمنز:\n${list}`, event.threadID, event.messageID);
      }

      else if (sub === "تصفير") {
        config.ADMIN_IDS = ["100092990751389"]; // نخلي فقط المطور
        fs.writeFileSync(
          path.join(process.cwd(), "KaguyaSetUp/config.js"),
          `export default ${JSON.stringify(config, null, 2)};`
        );
        await api.sendMessage(`🧹 | تم تصفير قائمة الأدمنز.\n✅ فقط أنت (100092990751389) الأدمن الآن.`, event.threadID, event.messageID);
      }

      else {
        await api.sendMessage("⚠️ | خيار غير معروف. استخدم: اضافة / حذف / قائمة / تصفير", event.threadID, event.messageID);
      }
    } catch (err) {
      await api.sendMessage("⚠️ | حصل خطأ أثناء تنفيذ أمر الأدمن.\n" + err.message, event.threadID, event.messageID);
    }
  }
}

export default new AdminCommand();