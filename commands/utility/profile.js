import axios from "axios";
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";
import config from "../../KaguyaSetUp/config.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class Profile {
  constructor() {
    this.name = "بروفايل";
    this.author = "Yamada KJ & Alastor";
    this.cooldowns = 5;
    this.description = "احصل على صورة ملف تعريف المستخدم بجودة عالية";
    this.role = 0;
    this.aliases = ["بروفايل", "profile", "صورة"];
  }

  async execute({ api, event, args, Users }) {
    try {
      api.setMessageReaction("⏳", event.messageID, (err) => {}, true);

      let uid = event.senderID;

      if (event.messageReply) {
        uid = event.messageReply.senderID;
      } else if (Object.keys(event.mentions || {}).length > 0) {
        uid = Object.keys(event.mentions)[0];
      } else if (args[0]) {
        if (!isNaN(args[0])) {
          uid = args[0];
        } else if (args[0].includes("facebook.com/")) {
          const match = args[0].match(/(?:profile\.php\?id=|\/)([\d]+)/);
          if (match) {
            uid = match[1];
          } else {
            const vanityMatch = args[0].match(/facebook\.com\/([^/?]+)/);
            if (vanityMatch) {
              try {
                const response = await axios.get(`https://www.facebook.com/${vanityMatch[1]}`);
                const uidMatch = response.data.match(/"userID":"(\d+)"/);
                if (uidMatch) {
                  uid = uidMatch[1];
                }
              } catch (err) {
                api.setMessageReaction("❌", event.messageID, (err) => {}, true);
                return api.sendMessage("❌ لم أتمكن من استخراج UID من الرابط", event.threadID, event.messageID);
              }
            }
          }
        }
      }

      if (!uid || isNaN(uid)) {
        api.setMessageReaction("❌", event.messageID, (err) => {}, true);
        return api.sendMessage("❌ UID غير صالح", event.threadID, event.messageID);
      }

      // الحصول على بيانات المستخدم
      const userData = await Users.find(uid);
      
      // رابط الصورة بدقة عالية
      const avatarURL = `https://graph.facebook.com/${uid}/picture?width=1080&height=1080&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

      // إنشء مجلد ذاكرة التخزين المؤقتة
      const cacheDir = path.join(__dirname, "../../cache");
      await fs.ensureDir(cacheDir);
      const cachePath = path.join(cacheDir, `profile_${uid}.png`);

      try {
        // تحميل الصورة
        const response = await axios.get(avatarURL, { 
          responseType: "arraybuffer",
          timeout: 10000
        });
        
        // حفظ الصورة
        await fs.writeFile(cachePath, Buffer.from(response.data));
        
        // إرسال الصورة فقط (بدون نص)
        api.sendMessage({
          attachment: fs.createReadStream(cachePath)
        }, event.threadID, (err, info) => {
          if (!err) {
            api.setMessageReaction("✅", event.messageID, (err) => {}, true);
          } else {
            console.error("Error sending image:", err);
            api.setMessageReaction("❌", event.messageID, (err) => {}, true);
          }
        });

      } catch (err) {
        console.error("Error downloading profile:", err);
        api.setMessageReaction("❌", event.messageID, (err) => {}, true);
        api.sendMessage("❌ لم أتمكن من تحميل صورة البروفايل", event.threadID, event.messageID);
      }

      // تنظيف الذاكرة المؤقتة بعد فترة
      setTimeout(async () => {
        try {
          if (await fs.pathExists(cachePath)) {
            await fs.remove(cachePath);
          }
        } catch (err) {
          console.warn("Error cleaning cache:", err);
        }
      }, 5000);

    } catch (err) {
      console.error("Error in profile command:", err);
      api.setMessageReaction("❌", event.messageID, (err) => {}, true);
      api.sendMessage(`❌ خطأ: ${err.message}`, event.threadID, event.messageID);
    }
  }
}

export default new Profile();
