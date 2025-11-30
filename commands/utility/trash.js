import axios from "axios";
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";
import jimp from "jimp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class TrashCommand {
  constructor() {
    this.name = "قمامة";
    this.author = "عمر & محسّن";
    this.cooldowns = 5;
    this.description = "تحويل صورة الملف الشخصي إلى صورة قمامة 🗑️";
    this.role = 0;
    this.aliases = ["قمامة", "trash", "قمامه"];
  }

  async onLoad() {
    console.log("[TRASH] تم تحضير أمر القمامة بنجاح");
  }

  async execute({ api, event, args }) {
    try {
      api.setMessageReaction("⏳", event.messageID, (err) => {}, true);

      const { threadID, messageID, senderID } = event;
      let targetID = null;

      // 1. تحقق من الرد على رسالة
      if (event.messageReply) {
        targetID = event.messageReply.senderID;
      }
      // 2. تحقق من المنشن
      else if (Object.keys(event.mentions || {}).length > 0) {
        targetID = Object.keys(event.mentions)[0];
      }
      // 3. تحقق من args
      else if (args[0]) {
        if (!isNaN(args[0])) {
          targetID = args[0];
        }
      }

      if (!targetID) {
        targetID = senderID;
      }

      api.setMessageReaction("🎨", event.messageID, (err) => {}, true);

      // الحصول على صورة الملف الشخصي
      const profilePicUrl = `https://graph.facebook.com/${targetID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

      // استخدام API لتطبيق تأثير القمامة
      const response = await axios.get(
        `https://api.popcat.xyz/trash?image=${encodeURIComponent(profilePicUrl)}`,
        {
          responseType: "arraybuffer",
          timeout: 30000
        }
      );

      const cacheDir = path.join(__dirname, "cache/canvas");
      fs.ensureDirSync(cacheDir);

      const tempFilePath = path.join(cacheDir, `trash_${targetID}_${Date.now()}.png`);

      // معالجة الصورة بـ Jimp لتحسين الجودة
      try {
        let image = await jimp.read(Buffer.from(response.data));

        // تحسينات على الصورة
        image = image.color([
          { apply: "saturate", params: [10] },
          { apply: "brighten", params: [3] }
        ]);

        image = image.sharpen();
        await image.write(tempFilePath);
      } catch (err) {
        // إذا فشلت معالجة jimp، احفظ الصورة مباشرة
        fs.writeFileSync(tempFilePath, Buffer.from(response.data));
      }

      const attachment = fs.createReadStream(tempFilePath);

      api.sendMessage(
        {
          body: "🗑️ قمامة! 🗑️",
          attachment: attachment
        },
        threadID,
        (err, info) => {
          setTimeout(() => {
            try {
              if (fs.existsSync(tempFilePath)) {
                fs.unlinkSync(tempFilePath);
              }
            } catch (e) {}
          }, 1000);
        },
        messageID
      );

      api.setMessageReaction("✅", event.messageID, (err) => {}, true);
    } catch (error) {
      console.error("[TRASH] خطأ:", error);
      api.setMessageReaction("❌", event.messageID, (err) => {}, true);
      api.sendMessage(
        `❌ حدث خطأ: ${error.message}`,
        event.threadID,
        event.messageID
      );
    }
  }
}

export default new TrashCommand();
