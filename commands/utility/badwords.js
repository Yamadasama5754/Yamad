import fs from "fs";

const configPath = "KaguyaSetUp/badWords.json";
const developerIDs = ["100092990751389"]; // ضع هنا IDs المطورين الحقيقيين

class BadWords {
  constructor() {
    this.name = "كلمات_بذيئة";
    this.version = "1.2";
    this.author = "Yamada KJ & Alastor";
    this.cooldowns = 5;
    this.role = 1;
    this.description = "إدارة الكلمات البذيئة (إضافة/إزالة/قائمة) وطرد من يستخدمها بالتطابق الكامل.";
    this.aliases = ["badwords", "كلمات"];
  }

  async execute({ api, event, args }) {
    const threadID = event.threadID;

    if (event.isGroup === false) {
      return api.sendMessage("⚠️ | هذا الأمر يعمل فقط في المجموعات.", threadID, event.messageID);
    }

    const subCommand = args[0];
    const word = args[1];

    let badWords = {};
    if (fs.existsSync(configPath)) {
      badWords = JSON.parse(fs.readFileSync(configPath, "utf8"));
    }
    if (!badWords[threadID]) badWords[threadID] = [];

    switch (subCommand) {
      case "اضافة": {
        if (!word) return api.sendMessage("⚠️ | يجب تحديد كلمة لإضافتها.", threadID, event.messageID);

        if (!badWords[threadID].includes(word)) {
          badWords[threadID].push(word);
          fs.writeFileSync(configPath, JSON.stringify(badWords, null, 2));
          api.sendMessage(`✅ | تمت إضافة الكلمة "${word}" إلى قائمة الكلمات البذيئة.`, threadID, event.messageID);
        } else {
          api.sendMessage(`ℹ️ | الكلمة "${word}" موجودة بالفعل.`, threadID, event.messageID);
        }
        break;
      }

      case "ازالة": {
        if (!word) return api.sendMessage("⚠️ | يجب تحديد كلمة لإزالتها.", threadID, event.messageID);

        if (!badWords[threadID].includes(word)) {
          return api.sendMessage(`❌ | الكلمة "${word}" غير موجودة في القائمة.`, threadID, event.messageID);
        }

        badWords[threadID] = badWords[threadID].filter(w => w !== word);
        fs.writeFileSync(configPath, JSON.stringify(badWords, null, 2));
        api.sendMessage(`✅ | تمت إزالة الكلمة "${word}" من القائمة.`, threadID, event.messageID);
        break;
      }

      case "قائمة": {
        if (badWords[threadID].length === 0) {
          api.sendMessage("📜 | لا توجد كلمات بذيئة مسجلة لهذه المجموعة.", threadID, event.messageID);
        } else {
          api.sendMessage("📜 | قائمة الكلمات البذيئة:\n- " + badWords[threadID].join("\n- "), threadID, event.messageID);
        }
        break;
      }

      default: {
        api.sendMessage(
          "⚙️ | أوامر الكلمات البذيئة:\n" +
          "- كلمات اضافة <كلمة>\n" +
          "- كلمات ازالة <كلمة>\n" +
          "- كلمات قائمة",
          threadID,
          event.messageID
        );
      }
    }
  }
}

// دالة لفحص الرسائل وطرد عند التطابق الكامل للكلمة
export function checkBadWords(api, event) {
  if (event.type === "message" && event.body && event.isGroup) {
    const threadID = event.threadID;
    const senderID = event.senderID;
    const msg = event.body.toLowerCase();

    // 🚫 استثناء البوت - لا طرد البوت نفسه
    const botID = api.getCurrentUserID();
    if (senderID === botID) {
      return;
    }

    // استثناء المطورين
    const developerID = "100092990751389";
    if (developerIDs.includes(senderID) || senderID === developerID) {
      return;
    }

    let badWords = {};
    if (fs.existsSync(configPath)) {
      badWords = JSON.parse(fs.readFileSync(configPath, "utf8"));
    }
    if (!badWords[threadID]) return;

    // تقسيم الرسالة إلى كلمات منفصلة
    const words = msg.split(/\s+/);

    for (const badWord of badWords[threadID]) {
      if (words.includes(badWord.toLowerCase())) {
        // استثناء المطورين
        if (developerIDs.includes(senderID)) {
          console.log(`[BADWORDS] المطور ${senderID} كتب كلمة "${badWord}" لكن مستثنى.`);
          return;
        }

        try {
          api.removeUserFromGroup(senderID, threadID, (err) => {
            if (err) {
              api.sendMessage(`⚠️ | البوت ليس أدمن، لا يمكن الطرد. لكن ${senderID} استخدم كلمة بذيئة: "${badWord}"`, threadID);
            } else {
              api.sendMessage(`🚫 | تم طرد ${senderID} لاستخدام كلمة بذيئة: "${badWord}"`, threadID);
            }
          });
        } catch (err) {
          console.error("❌ فشل في الطرد:", err.message);
        }
        break;
      }
    }
  }
}

export default new BadWords();