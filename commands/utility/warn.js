import fs from "fs-extra";
import path from "path";
import config from "../../KaguyaSetUp/config.js";

const warnsFile = path.join(process.cwd(), "database/warns.json");

const getWarns = (threadID) => {
  try {
    const data = fs.readJsonSync(warnsFile);
    return data[threadID] || {};
  } catch {
    return {};
  }
};

const saveWarns = (threadID, warns) => {
  try {
    const data = fs.readJsonSync(warnsFile);
    data[threadID] = warns;
    fs.writeFileSync(warnsFile, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("خطأ في حفظ التحذيرات:", err);
  }
};

class Warn {
  constructor() {
    this.name = "تحذير";
    this.author = "Yamada KJ & Alastor";
    this.cooldowns = 3;
    this.description = "نظام التحذيرات المتكامل - تحذير، عرض القائمة، إزالة";
    this.role = 1;
    this.aliases = ["warn", "تحذيرات"];
  }

  // التحقق من صحة معرف المستخدم (يجب أن يكون رقم)
  isValidUserID(id) {
    return /^\d+$/.test(id) && id.length >= 5;
  }

  async warnUser(api, threadID, targetID, reason, senderID) {
    // التحقق من صحة المعرف
    if (!this.isValidUserID(targetID)) {
      return {
        error: true,
        message: `❌ معرف العضو غير صحيح! يجب أن يكون رقماً\n\nالاستخدام الصحيح: .تحذير [معرف رقمي] [السبب]\nمثال: .تحذير 123456789 تصرف سيء`
      };
    }

    // 🚫 منع تحذير الأدمن والبوت تماماً (حتى المطورون)
    const targetIsAdmin = config.ADMIN_IDS.includes(targetID);
    const botID = api.getCurrentUserID();
    
    if (targetIsAdmin || targetID === botID) {
      return {
        error: true,
        message: `🔒 | لا يمكن تحذير الأدمن أو البوت! هم محميون من التحذيرات.`
      };
    }

    let warns = getWarns(threadID);
    if (!warns[targetID]) {
      warns[targetID] = {
        count: 0,
        reasons: [],
        warnedBy: [],
        warnedAt: []
      };
    }

    warns[targetID].count += 1;
    warns[targetID].reasons.push(reason);
    warns[targetID].warnedBy.push(senderID);
    warns[targetID].warnedAt.push(new Date().toISOString());

    saveWarns(threadID, warns);

    const warnCount = warns[targetID].count;
    let msg = `⚠️ تم تحذير العضو!\n\n`;
    msg += `🆔 المعرف: ${targetID}\n`;
    msg += `📋 السبب: ${reason}\n`;
    msg += `🔢 عدد التحذيرات: ${warnCount}/3\n`;

    if (warnCount >= 3) {
      try {
        await api.removeUserFromGroup(targetID, threadID);
        msg += `\n🚫 تم طرد العضو بسبب الوصول إلى 3 تحذيرات!`;
        warns[targetID].kicked = true;
        warns[targetID].kickedDate = new Date().toISOString();
        saveWarns(threadID, warns);
      } catch (err) {
        msg += `\n⚠️ فشل طرد العضو: ${err.message}`;
      }
    }

    return { error: false, message: msg };
  }

  async removeWarnUser(api, threadID, targetID, amount = 1) {
    // التحقق من صحة المعرف
    if (!this.isValidUserID(targetID)) {
      return {
        error: true,
        message: `❌ معرف العضو غير صحيح! يجب أن يكون رقماً\n\nالاستخدام الصحيح: .تحذير إزالة [معرف رقمي] [العدد]`
      };
    }

    let warns = getWarns(threadID);

    if (!warns[targetID] || warns[targetID].count === 0) {
      return {
        error: true,
        message: `⚠️ هذا العضو ليس لديه تحذيرات`
      };
    }

    const oldCount = warns[targetID].count;
    warns[targetID].count = Math.max(0, warns[targetID].count - amount);

    if (warns[targetID].count === 0) {
      warns[targetID].reasons = [];
      warns[targetID].warnedBy = [];
      warns[targetID].warnedAt = [];
    } else {
      warns[targetID].reasons = warns[targetID].reasons.slice(0, warns[targetID].count);
      warns[targetID].warnedBy = warns[targetID].warnedBy.slice(0, warns[targetID].count);
      warns[targetID].warnedAt = warns[targetID].warnedAt.slice(0, warns[targetID].count);
    }

    if (warns[targetID].kicked && warns[targetID].count < 3) {
      warns[targetID].kicked = false;
    }

    saveWarns(threadID, warns);

    let msg = `✅ تم إزالة التحذير!\n\n`;
    msg += `🆔 المعرف: ${targetID}\n`;
    msg += `📉 من ${oldCount} إلى ${warns[targetID].count} تحذير\n`;

    return { error: false, message: msg };
  }

  async execute({ api, event, args }) {
    try {
      // ✅ تحقق: هل هذا في مجموعة؟
      const threadInfo = await api.getThreadInfo(event.threadID);
      if (!threadInfo.isGroup) {
        return api.sendMessage(
          "⚠️ | هذا الأمر يعمل فقط في المجموعات.",
          event.threadID,
          event.messageID
        );
      }

      api.setMessageReaction("⚠️", event.messageID, (err) => {}, true);

      const { threadID, senderID } = event;
      const subCommand = args[0]?.toLowerCase() || "help";

      // التحقق من أن البوت أدمن
      const botID = api.getCurrentUserID();
      const isBotAdmin = threadInfo.adminIDs?.some(admin => admin.id === botID);

      if (!isBotAdmin) {
        api.setMessageReaction("❌", event.messageID, (err) => {}, true);
        return api.sendMessage("❌ البوت يجب أن يكون أدمن لاستخدام هذا الأمر", threadID);
      }

      // عرض القائمة
      if (subCommand === "قائمة" || subCommand === "list") {
        const warns = getWarns(threadID);
        const warnedUsers = Object.entries(warns).filter(([_, data]) => data.count > 0);

        if (warnedUsers.length === 0) {
          api.setMessageReaction("✅", event.messageID, (err) => {}, true);
          return api.sendMessage("✅ لا توجد أي تحذيرات في هذه المجموعة", threadID);
        }

        let msg = `📋 | قائمة المحذورين في المجموعة\n\n`;
        msg += `═══════════════════════\n`;

        warnedUsers.forEach(([userID, data], index) => {
          msg += `\n${index + 1}️⃣ المعرف: ${userID}\n`;
          msg += `   🔢 التحذيرات: ${data.count}/3\n`;
          msg += `   ⏰ آخر تحذير: ${new Date(data.warnedAt[data.warnedAt.length - 1]).toLocaleString('ar-SA')}\n`;
          msg += `   📝 آخر سبب: ${data.reasons[data.reasons.length - 1]}\n`;
          if (data.kicked) {
            msg += `   🚫 حالة: تم طرده بسبب تحذيرات\n`;
          }
          msg += `   ─────────────────────\n`;
        });

        msg += `═══════════════════════\n`;
        msg += `📊 إجمالي المحذورين: ${warnedUsers.length}`;

        api.setMessageReaction("✅", event.messageID, (err) => {}, true);
        return api.sendMessage(msg, threadID);
      }

      // إزالة التحذير
      if (subCommand === "إزالة" || subCommand === "remove") {
        const targetID = args[1];
        const amount = parseInt(args[2]) || 1;

        if (!targetID) {
          return api.sendMessage("❌ استخدم: .تحذير إزالة [معرف العضو] [العدد]\n\nمثال: .تحذير إزالة 123456789 1", threadID);
        }

        const result = await this.removeWarnUser(api, threadID, targetID, amount);
        if (result.error) {
          api.setMessageReaction("❌", event.messageID, (err) => {}, true);
          return api.sendMessage(result.message, threadID);
        }
        api.setMessageReaction("✅", event.messageID, (err) => {}, true);
        return api.sendMessage(result.message, threadID);
      }

      // تحذير عضو بالمعرف (الأمر الرئيسي)
      if (subCommand !== "مساعدة" && subCommand !== "help" && args.length > 0) {
        const targetID = subCommand;
        // السبب هو جميع الكلمات بعد المعرف
        const reason = args.slice(1).join(" ") || "لا يوجد سبب";

        const result = await this.warnUser(api, threadID, targetID, reason, senderID);
        if (result.error) {
          api.setMessageReaction("❌", event.messageID, (err) => {}, true);
          return api.sendMessage(result.message, threadID);
        }
        api.setMessageReaction("✅", event.messageID, (err) => {}, true);
        return api.sendMessage(result.message, threadID);
      }

      // عندما لا يتم إدخال أي شيء - اطلب الكتابة بشكل صحيح
      return api.sendMessage(`✨ اكتب: .مساعدة تحذير`, threadID);
    } catch (err) {
      console.error("❌ خطأ في تحذير:", err);
      api.setMessageReaction("❌", event.messageID, (err) => {}, true);
      return api.sendMessage(`❌ خطأ: ${err.message}`, event.threadID);
    }
  }

  async onReply({ api, event, reply }) {
    try {
      const { threadID, senderID, body } = event;

      // تنظيف الأمر من النقاط والمسافات الزائدة
      const cleanBody = body.trim();
      
      // التحقق من أن الرسالة تبدأ بأمر تحذير
      if (!cleanBody.match(/^\.?تحذير|^\.?warn/i)) {
        return; // ليس أمر تحذير
      }

      // الحصول على معرف الشخص الذي تم الرد على رسالته
      let targetID = reply.userID || reply.senderID;

      if (!targetID) {
        return api.sendMessage("❌ لم أستطع الحصول على معرف المستخدم من الرد", threadID);
      }

      // تحويل إلى string وإزالة أي أحرف غير أرقام
      targetID = String(targetID).replace(/[^\d]/g, '');

      if (!targetID || targetID.length < 5) {
        return api.sendMessage("❌ معرف المستخدم غير صحيح", threadID);
      }

      // التحقق من أن البوت أدمن
      const threadInfo = await api.getThreadInfo(threadID);
      const botID = api.getCurrentUserID();
      const isBotAdmin = threadInfo.adminIDs?.some(admin => admin.id === botID);

      if (!isBotAdmin) {
        api.setMessageReaction("❌", event.messageID, (err) => {}, true);
        return api.sendMessage("❌ البوت يجب أن يكون أدمن لاستخدام هذا الأمر", threadID);
      }

      api.setMessageReaction("⚠️", event.messageID, (err) => {}, true);

      // تحليل الرسالة
      const parts = cleanBody.split(/\s+/);
      
      // تجاوز الأمر (البارت الأول: .تحذير أو تحذير)
      let contentParts = parts.slice(1);
      
      // التحقق من وجود "إزالة"
      const firstParam = contentParts[0]?.toLowerCase();
      
      // إزالة تحذير برد
      if (firstParam === "إزالة" || firstParam === "remove") {
        const amount = parseInt(contentParts[1]) || 1;
        
        let warns = getWarns(threadID);
        if (!warns[targetID] || warns[targetID].count === 0) {
          api.setMessageReaction("❌", event.messageID, (err) => {}, true);
          return api.sendMessage(`⚠️ هذا العضو ليس لديه تحذيرات`, threadID);
        }

        const oldCount = warns[targetID].count;
        warns[targetID].count = Math.max(0, warns[targetID].count - amount);

        if (warns[targetID].count === 0) {
          warns[targetID].reasons = [];
          warns[targetID].warnedBy = [];
          warns[targetID].warnedAt = [];
        } else {
          warns[targetID].reasons = warns[targetID].reasons.slice(0, warns[targetID].count);
          warns[targetID].warnedBy = warns[targetID].warnedBy.slice(0, warns[targetID].count);
          warns[targetID].warnedAt = warns[targetID].warnedAt.slice(0, warns[targetID].count);
        }

        if (warns[targetID].kicked && warns[targetID].count < 3) {
          warns[targetID].kicked = false;
        }

        saveWarns(threadID, warns);

        let msg = `✅ تم إزالة التحذير!\n\n`;
        msg += `🆔 المعرف: ${targetID}\n`;
        msg += `📉 من ${oldCount} إلى ${warns[targetID].count} تحذير\n`;

        api.setMessageReaction("✅", event.messageID, (err) => {}, true);
        return api.sendMessage(msg, threadID);
      }

      // 🚫 منع تحذير الأدمن إلا المطورون فقط
      const senderIsDeveloper = config.ADMIN_IDS.includes(senderID);
      const targetIsAdmin = config.ADMIN_IDS.includes(targetID);
      
      if (targetIsAdmin && !senderIsDeveloper) {
        api.setMessageReaction("❌", event.messageID, (err) => {}, true);
        return api.sendMessage(`🔒 | لا يمكن تحذير الأدمن! فقط المطورون يمكنهم تحذير الأدمن.`, threadID);
      }

      // تحذير عضو برد - السبب هو جميع الكلمات بعد الأمر
      const reason = contentParts.join(" ") || "لا يوجد سبب";
      
      let warns = getWarns(threadID);
      if (!warns[targetID]) {
        warns[targetID] = {
          count: 0,
          reasons: [],
          warnedBy: [],
          warnedAt: []
        };
      }

      warns[targetID].count += 1;
      warns[targetID].reasons.push(reason);
      warns[targetID].warnedBy.push(senderID);
      warns[targetID].warnedAt.push(new Date().toISOString());

      saveWarns(threadID, warns);

      const warnCount = warns[targetID].count;
      let msg = `⚠️ تم تحذير العضو!\n\n`;
      msg += `🆔 المعرف: ${targetID}\n`;
      msg += `📋 السبب: ${reason}\n`;
      msg += `🔢 عدد التحذيرات: ${warnCount}/3\n`;

      if (warnCount >= 3) {
        try {
          await api.removeUserFromGroup(targetID, threadID);
          msg += `\n🚫 تم طرد العضو بسبب الوصول إلى 3 تحذيرات!`;
          warns[targetID].kicked = true;
          warns[targetID].kickedDate = new Date().toISOString();
          saveWarns(threadID, warns);
        } catch (err) {
          msg += `\n⚠️ فشل طرد العضو: ${err.message}`;
        }
      }

      api.setMessageReaction("✅", event.messageID, (err) => {}, true);
      return api.sendMessage(msg, threadID);

    } catch (err) {
      console.error("❌ خطأ في onReply:", err);
      return api.sendMessage(`❌ خطأ: ${err.message}`, event.threadID);
    }
  }
}

export default new Warn();
