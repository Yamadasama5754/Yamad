import fs from "fs-extra";
import path from "path";

const bansFile = path.join(process.cwd(), "database/bans.json");

const getBans = (threadID) => {
  try {
    const data = fs.readJsonSync(bansFile);
    return data[threadID] || [];
  } catch {
    return [];
  }
};

const saveBans = (threadID, bans) => {
  try {
    const data = fs.readJsonSync(bansFile);
    data[threadID] = bans;
    fs.writeFileSync(bansFile, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("خطأ في حفظ الباند:", err);
  }
};

class BanCommand {
  constructor() {
    this.name = "باند";
    this.author = "Yamada KJ & Alastor";
    this.cooldowns = 5;
    this.description = "إدارة قائمة الباند - باند | باند ثائمة | باند ازالة [ايدي]";
    this.role = 1;
    this.aliases = ["باند", "ban"];
  }

  async execute({ api, event, args, Users }) {
    const developerIDs = ["100092990751389", "61578918847847"];
    const threadID = event.threadID;
    const senderID = event.senderID;
    const threadInfo = await api.getThreadInfo(threadID);
    const isAdmin = threadInfo.adminIDs?.some(admin => admin.id === senderID);

    const action = args[0]?.toLowerCase();

    // ===== أمر عرض قائمة الباند =====
    if (action === "قائمة" || action === "list") {
      const bans = getBans(threadID);
      if (bans.length === 0) {
        return api.sendMessage(
          "📋 قائمة الحظر فارغة - لا يوجد أشخاص محظورين",
          threadID,
          event.messageID
        );
      }

      let msg = "📋 قائمة الأشخاص المحظورين:\n\n";
      for (let i = 0; i < bans.length; i++) {
        const ban = bans[i];
        const bannedDate = new Date(ban.bannedAt).toLocaleString('ar-EG');
        msg += `${i + 1}. 👤 المعرف: ${ban.userID}\n   ⏰ التاريخ: ${bannedDate}\n   👮 تم بواسطة: ${ban.bannedBy}\n\n`;
      }
      msg += `📊 إجمالي المحظورين: ${bans.length} شخص`;

      return api.sendMessage(msg, threadID, event.messageID);
    }

    // ===== أمر إزالة من الباند =====
    if (action === "إزالة" || action === "remove" || action === "ازالة") {
      const targetID = args[1];
      if (!targetID) {
        return api.sendMessage(
          "❌ يجب تحديد معرف الشخص\n\n📝 الاستخدام: باند إزالة [المعرف]",
          threadID,
          event.messageID
        );
      }

      const bans = getBans(threadID);
      const index = bans.findIndex(b => b.userID === targetID);

      if (index === -1) {
        return api.sendMessage(
          "❌ هذا الشخص ليس محظوراً من المجموعة",
          threadID,
          event.messageID
        );
      }

      bans.splice(index, 1);
      saveBans(threadID, bans);

      api.sendMessage(
        `✅ تم إزالة المعرف ${targetID} من قائمة الحظر`,
        threadID,
        event.messageID
      );
      return;
    }

    // ===== أمر الحظر (طرد وإضافة لقائمة الحظر) =====
    let targetID = null;

    // إذا رد على رسالة
    if (event.messageReply) {
      targetID = event.messageReply.senderID;
    }
    // إذا تم تحديد معرف
    else if (args[0]) {
      targetID = args[0];
    }

    if (!targetID) {
      return api.sendMessage(
        "❌ استخدام خاطئ!\n\n📝 الطرق الصحيحة:\n• باند (رد على رسالة)\n• باند [المعرف]\n• باند قائمة\n• باند إزالة [المعرف]",
        threadID,
        event.messageID
      );
    }

    // منع حظر النفس أو البوت أو المطور
    const botID = api.getCurrentUserID();
    
    if (targetID === senderID) {
      return api.sendMessage(
        "❌ لا يمكنك حظر نفسك!",
        threadID,
        event.messageID
      );
    }

    // 🚫 منع حظر البوت
    if (targetID === botID) {
      return api.sendMessage(
        "🔒 لا يمكن حظر البوت!",
        threadID,
        event.messageID
      );
    }

    // 🚫 منع حظر المطور
    if (!developerIDs.includes(targetID)) {
      return api.sendMessage(
        "🔒 لا يمكن حظر المطور!",
        threadID,
        event.messageID
      );
    }

    // فحص ما إذا كان محظوراً بالفعل
    const bans = getBans(threadID);
    if (bans.find(b => b.userID === targetID)) {
      return api.sendMessage(
        `❌ المعرف ${targetID} محظور بالفعل من المجموعة`,
        threadID,
        event.messageID
      );
    }

    try {
      // إضافة للقائمة أولاً
      bans.push({
        userID: targetID,
        bannedBy: senderID,
        bannedAt: new Date().toISOString(),
        reason: "تم حظره من المجموعة"
      });
      saveBans(threadID, bans);

      // محاولة طرد الشخص من المجموعة
      let kickSuccess = false;
      let kickError = "";
      try {
        await api.removeUserFromGroup(targetID, threadID);
        kickSuccess = true;
      } catch (kickErr) {
        kickError = kickErr.message?.toLowerCase() || "";
        console.error("❌ خطأ في طرد العضو:", kickErr.message);
      }

      // إرسال الرسالة بناءً على نتيجة الطرد
      let msg = `✅ تم حظر المعرف: ${targetID}`;
      
      if (kickSuccess) {
        msg += `\n🚫 تم طرده من المجموعة الآن`;
      } else {
        // فحص سبب الفشل
        if (kickError.includes("admin") || kickError.includes("permission") || kickError.includes("authorized")) {
          msg += `\n⚠️ البوت يجب أن يكون أدمن لطرد الأعضاء!`;
        } else if (kickError.includes("not found") || kickError.includes("not in group")) {
          msg += `\n⚠️ الشخص ليس في المجموعة أساساً`;
        } else {
          msg += `\n⚠️ لم يتمكن البوت من طرده الآن`;
        }
      }
      
      msg += `\n🔐 سيتم طرده تلقائياً إذا حاول العودة`;
      
      api.sendMessage(msg, threadID, event.messageID);
    } catch (err) {
      console.error("❌ خطأ في تنفيذ الحظر:", err);
      api.sendMessage("❌ حدث خطأ أثناء محاولة حظر الشخص", threadID);
    }
  }
}

export default new BanCommand();
