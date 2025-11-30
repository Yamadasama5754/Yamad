import axios from "axios";
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";
import jimp from "jimp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class ShangCommand {
  constructor() {
    this.name = "شنق";
    this.author = "عمر & محسّن";
    this.cooldowns = 5;
    this.description = "تشنق شخص بمنشن أو رد على رسالة 🪢";
    this.role = 0;
    this.aliases = ["شنق", "hang", "تشنق"];
  }

  async onLoad() {
    const dirMaterial = path.join(__dirname, "cache/canvas/");
    const imagePath = path.join(dirMaterial, "smto.png");
    
    if (!fs.existsSync(dirMaterial)) {
      fs.mkdirSync(dirMaterial, { recursive: true });
    }
    
    if (!fs.existsSync(imagePath)) {
      await this.downloadFile(
        "https://i.postimg.cc/brq6rDDB/received-1417994055426496.jpg",
        imagePath
      );
    }
  }

  async downloadFile(url, filePath) {
    try {
      const response = await axios.get(url, { responseType: "arraybuffer" });
      fs.writeFileSync(filePath, Buffer.from(response.data));
    } catch (err) {
      console.warn(`Failed to download ${url}:`, err.message);
    }
  }

  async makeCircle(imagePath) {
    try {
      let image = await jimp.read(imagePath);
      image.circle();
      return await image.getBufferAsync("image/png");
    } catch (err) {
      console.error("Error creating circle:", err);
      throw err;
    }
  }

  async makeImage({ one, two, isReply = false }) {
    const cacheDir = path.join(__dirname, "cache/canvas");
    fs.ensureDirSync(cacheDir);

    let baseImg = await jimp.read(path.join(cacheDir, "smto.png"));
    let outputPath = path.join(cacheDir, `shang_${one}_${two}.png`);
    let avatarOne = path.join(cacheDir, `avt_${one}.png`);
    let avatarTwo = path.join(cacheDir, `avt_${two}.png`);

    try {
      // تحميل صور الملفات الشخصية
      let avatarTwoData = (
        await axios.get(
          `https://graph.facebook.com/${two}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`,
          { responseType: "arraybuffer" }
        )
      ).data;
      fs.writeFileSync(avatarTwo, Buffer.from(avatarTwoData));

      // إنشاء دائرة للهدف (صورة الشخص المشنوق فقط)
      let circleTwo = await jimp.read(await this.makeCircle(avatarTwo));

      // ضع صورة الهدف في مكان الرأس بدقة
      // الموضع: (315, 95) والحجم: 120x120 لتطابق حجم الرأس الطبيعي
      baseImg.composite(circleTwo.resize(120, 120), 315, 95);

      let raw = await baseImg.getBufferAsync("image/png");
      fs.writeFileSync(outputPath, raw);

      // تنظيف الملفات المؤقتة
      fs.unlinkSync(avatarTwo);

      return outputPath;
    } catch (err) {
      console.error("Error in makeImage:", err);
      // تنظيف في حالة الخطأ
      if (fs.existsSync(avatarOne)) fs.unlinkSync(avatarOne);
      if (fs.existsSync(avatarTwo)) fs.unlinkSync(avatarTwo);
      throw err;
    }
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
        api.setMessageReaction("❌", event.messageID, (err) => {}, true);
        return api.sendMessage(
          "❌ شنّق مين؟\n💡 منشن شخص أو رد على رسالته",
          threadID,
          messageID
        );
      }

      // تحويل senderID و targetID للتأكد أنهم strings
      const senderId = String(senderID);
      const targetUserId = String(targetID);

      api.setMessageReaction("🎨", event.messageID, (err) => {}, true);

      let imagePath = await this.makeImage({
        one: senderId,
        two: targetUserId,
        isReply: !!event.messageReply
      });

      api.sendMessage(
        {
          attachment: fs.createReadStream(imagePath)
        },
        threadID,
        (err, info) => {
          // تنظيف الصورة بعد الإرسال
          setTimeout(() => {
            if (fs.existsSync(imagePath)) {
              fs.unlinkSync(imagePath);
            }
          }, 1000);
        }
      );

      api.setMessageReaction("✅", event.messageID, (err) => {}, true);

    } catch (error) {
      console.error("[SHANG] خطأ:", error);
      api.setMessageReaction("❌", event.messageID, (err) => {}, true);
      api.sendMessage(
        `❌ حدث خطأ: ${error.message}`,
        event.threadID,
        event.messageID
      );
    }
  }
}

export default new ShangCommand();
