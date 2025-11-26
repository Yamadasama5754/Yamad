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
    const developerID = "100092990751389";
    const threadID = event.threadID;
    const senderID = event.senderID;
    const threadInfo = await api.getThreadInfo(threadID);
    const isAdmin = threadInfo.adminIDs?.some(admin => admin.id === senderID);

    const action = args[0]?.toLowerCase();

    // ===== أمر عرض قائمة الباند =====
    if (action === "ثائمة" || action === "قائمة" || action === "list") {
      const bans = getBans(threadID);
      if (bans.length === 0) {
        return api.sendMessage(
          "📋 قائمة الباند فارغة",
          threadID,
          event.messageID
        );
      }

      let msg = "📋 قائمة الأشخاص المبانين:\n\n";
      for (let i = 0; i < bans.length; i++) {
        msg += `${i + 1}. ${bans[i].userID}\n`;
      }
      msg += `\n📊 المجموع: ${bans.length} شخص`;

      return api.sendMessage(msg, threadID, event.messageID);
    }

    // ===== أمر إزالة من الباند =====
    if (action === "ازالة" || action === "remove") {
      const targetID = args[1];
      if (!targetID) {
        return api.sendMessage(
          "❌ يجب تحديد ايدي الشخص\n\n📝 الاستخدام: باند ازالة [ايدي]",
          threadID,
          event.messageID
        );
      }

      const bans = getBans(threadID);
      const index = bans.findIndex(b => b.userID === targetID);

      if (index === -1) {
        return api.sendMessage(
          "❌ هذا الشخص ليس مبان",
          threadID,
          event.messageID
        );
      }

      bans.splice(index, 1);
      saveBans(threadID, bans);

      api.sendMessage(
        `✅ تم إزالة ${targetID} من قائمة الباند`,
        threadID,
        event.messageID
      );
      return;
    }

    // ===== أمر الباند (طرد وإضافة لقائمة الباند) =====
    let targetID = null;

    // إذا رد على رسالة
    if (event.messageReply) {
      targetID = event.messageReply.senderID;
    }
    // إذا تم تحديد ايدي
    else if (args[0]) {
      targetID = args[0];
    }

    if (!targetID) {
      return api.sendMessage(
        "❌ استخدام خاطئ!\n\n📝 الطرق الصحيحة:\n• باند (رد على رسالة)\n• باند [ايدي]\n• باند ثائمة\n• باند ازالة [ايدي]",
        threadID,
        event.messageID
      );
    }

    // منع بان النفس أو البوت أو المطور
    const botID = api.getCurrentUserID();
    
    if (targetID === senderID) {
      return api.sendMessage(
        "❌ لا يمكن بان نفسك!",
        threadID,
        event.messageID
      );
    }

    // 🚫 منع بان البوت (فقط المطور)
    if (targetID === botID) {
      if (senderID !== developerID) {
        return api.sendMessage(
          "🔒 | لا يمكن بان البوت! فقط المطور يقدر يبانه.",
          threadID,
          event.messageID
        );
      }
    }

    // 🚫 منع بان المطور
    if (targetID === developerID) {
      return api.sendMessage(
        "🔒 | لا يمكن بان المطور!",
        threadID,
        event.messageID
      );
    }

    // فحص ما إذا كان مبان بالفعل
    const bans = getBans(threadID);
    if (bans.find(b => b.userID === targetID)) {
      return api.sendMessage(
        `❌ ${targetID} مبان بالفعل`,
        threadID,
        event.messageID
      );
    }

    try {
      // إضافة للقائمة أولاً
      bans.push({
        userID: targetID,
        bannedBy: senderID,
        bannedAt: new Date().toISOString()
      });
      saveBans(threadID, bans);

      // محاولة طرد الشخص
      let kickSuccess = false;
      let kickError = null;
      try {
        await api.removeUserFromGroup(targetID, threadID);
        kickSuccess = true;
      } catch (kickErr) {
        console.error("❌ فشل الطرد من المجموعة:", kickErr.message);
        kickError = kickErr.message?.toLowerCase() || "";
      }

      // إرسال الرسالة بناءً على نتيجة الطرد
      let msg = `✅ تم بان ${targetID}`;
      if (kickSuccess) {
        msg += `\n🚫 تم طرده الآن من المجموعة`;
      } else {
        // فحص سبب الفشل
        if (kickError.includes("not admin") || kickError.includes("not authorized") || kickError.includes("permission")) {
          msg += `\n⚠️ البوت يجب أن يصبح أدمن في المجموعة لطرد الأعضاء!`;
        } else {
          msg += `\n⚠️ لم نتمكن من طرده الآن لكن سيتم طرده إذا عاد`;
        }
      }
      msg += `\n🔐 إذا تمت إعادته سيتم طرده تلقائياً`;
      
      api.sendMessage(msg, threadID, event.messageID);
    } catch (err) {
      console.error("خطأ في تنفيذ الباند:", err);
      api.sendMessage("❌ حدث خطأ", threadID);
    }
  }
}

export default new BanCommand();
