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
    this.description = "احصل على صورة ملف تعريف المستخدم";
    this.role = 0;
    this.aliases = ["بروفايل", "profile", "صورة"];
  }

  async execute({ api, event, args, Users }) {
    try {
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
                return api.sendMessage("❌ لم أتمكن من استخراج UID من الرابط", event.threadID, event.messageID);
              }
            }
          }
        }
      }

      if (!uid || isNaN(uid)) {
        return api.sendMessage("❌ UID غير صالح", event.threadID, event.messageID);
      }

      const userData = await Users.find(uid);
      const avatarURL = `https://graph.facebook.com/${uid}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

      const cacheDir = path.join(__dirname, "../../cache");
      await fs.ensureDir(cacheDir);
      const cachePath = path.join(cacheDir, `profile_${uid}.jpg`);

      const response = await axios.get(avatarURL, { responseType: "arraybuffer" });
      await fs.writeFile(cachePath, Buffer.from(response.data));

      api.sendMessage({
        attachment: fs.createReadStream(cachePath)
      }, event.threadID);

      setTimeout(async () => {
        try {
          await fs.remove(cachePath);
        } catch (err) {
          console.log("Error removing cache file:", err);
        }
      }, 2000);

    } catch (err) {
      console.error("Error in profile command:", err);
      api.sendMessage(`❌ خطأ: ${err.message}`, event.threadID, event.messageID);
    }
  }
}

export default new Profile();
