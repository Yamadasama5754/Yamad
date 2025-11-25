import fs from "fs-extra";
import axios from "axios";
import { loadImage, createCanvas } from "canvas";
import path from "path";

class WantedCommand {
  constructor() {
    this.name = "مطلوب";
    this.author = "Yamada KJ & Alastor";
    this.cooldowns = 5;
    this.description = "ضع صورتك على بوستر مطلوب | الاستخدام: مطلوب أو مطلوب [رد على رسالة] أو مطلوب [@شخص]";
    this.role = 0;
    this.aliases = ["مطلوب", "wanted"];
  }

  async execute({ api, event, args }) {
    const { senderID, threadID, messageID } = event;
    
    try {
      const cacheDir = path.join(process.cwd(), "cache");
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }

      const pathImg = path.join(cacheDir, `wanted_${Date.now()}.png`);
      const pathAva = path.join(cacheDir, `avatar_${Date.now()}.png`);

      let targetID = senderID;

      // إذا تم الرد على رسالة
      if (event.messageReply) {
        targetID = event.messageReply.senderID;
      }
      // إذا تم ذكر شخص
      else if (event.mentions && Object.keys(event.mentions).length > 0) {
        targetID = Object.keys(event.mentions)[0];
      }
      // إذا تم تحديد معرف
      else if (args[0] && /^\d+$/.test(args[0])) {
        targetID = args[0];
      }

      api.sendMessage("🔄 جاري إنشاء البوستر...", threadID, messageID);

      // الحصول على صورة الملف الشخصي
      let avatarBuffer;
      try {
        const avatarResponse = await axios.get(
          `https://graph.facebook.com/${targetID}/picture?height=1500&width=1500&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`,
          { responseType: "arraybuffer", timeout: 10000 }
        );
        avatarBuffer = Buffer.from(avatarResponse.data);
      } catch (err) {
        console.error("❌ خطأ في الحصول على الصورة الشخصية:", err.message);
        return api.sendMessage("❌ لم أتمكن من الحصول على صورتك. تأكد من أن معرفك صحيح.", threadID);
      }

      fs.writeFileSync(pathAva, avatarBuffer);

      // الحصول على صورة البوستر
      let wantedBuffer;
      try {
        const wantedResponse = await axios.get(
          "https://i.postimg.cc/vmFqjkw8/467471884-1091680152417037-7359182676446817237-n.jpg",
          { responseType: "arraybuffer", timeout: 10000 }
        );
        wantedBuffer = Buffer.from(wantedResponse.data);
      } catch (err) {
        console.error("❌ خطأ في الحصول على صورة البوستر:", err.message);
        fs.removeSync(pathAva);
        return api.sendMessage("❌ لم أتمكن من الحصول على صورة البوستر.", threadID);
      }

      fs.writeFileSync(pathImg, wantedBuffer);

      // تحميل الصور
      const baseImage = await loadImage(pathImg);
      const baseAva = await loadImage(pathAva);

      // إنشاء canvas ورسم الصور
      const canvas = createCanvas(baseImage.width, baseImage.height);
      const ctx = canvas.getContext("2d");
      
      ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);
      ctx.drawImage(baseAva, 144, 229, 290, 290);

      // تحويل canvas إلى buffer
      const imageBuffer = canvas.toBuffer();
      fs.writeFileSync(pathImg, imageBuffer);
      fs.removeSync(pathAva);

      // إرسال الصورة
      api.sendMessage(
        { attachment: fs.createReadStream(pathImg) },
        threadID,
        () => {
          try {
            fs.unlinkSync(pathImg);
          } catch (err) {
            console.warn("⚠️ تحذير: فشل حذف الملف المؤقت:", err.message);
          }
        },
        messageID
      );
    } catch (error) {
      console.error("❌ خطأ في أمر المطلوب:", error.message);
      api.sendMessage(
        "❌ حدث خطأ أثناء إنشاء البوستر. حاول مرة أخرى.",
        threadID,
        messageID
      );
    }
  }
}

export default new WantedCommand();
