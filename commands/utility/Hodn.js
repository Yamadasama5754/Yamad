import fs from "fs-extra";
import path from "path";
import axios from "axios";
import jimp from "jimp";

const __dirname = path.dirname(new URL(import.meta.url).pathname);

class HugCommand {
  constructor() {
    this.name = "حضن";
    this.author = "S H A D O W - Updated by Yamada KJ";
    this.cooldowns = 5;
    this.description = "احضن حبيبك | الاستخدام: احضن @منشن أو رد على رسالة وقل احضن";
    this.role = 0;
    this.aliases = ["احضن", "hug"];
  }

  async onLoad() {
    const dirMaterial = path.resolve(__dirname, "../..", "cache/canvas/");
    const hugPath = path.resolve(dirMaterial, "hugv1.png");
    
    try {
      if (!fs.existsSync(dirMaterial)) {
        fs.mkdirSync(dirMaterial, { recursive: true });
      }
      
      if (!fs.existsSync(hugPath)) {
        await this.downloadFile(
          "https://i.ibb.co/3YN3T1r/q1y28eqblsr21.jpg",
          hugPath
        );
      }
    } catch (err) {
      console.error("Error loading hug command resources:", err);
    }
  }

  async downloadFile(url, filepath) {
    const response = await axios.get(url, { responseType: "arraybuffer" });
    fs.writeFileSync(filepath, response.data);
  }

  async makeImage({ one, two }) {
    const __root = path.resolve(__dirname, "../..", "cache", "canvas");
    let batgiam_img = await jimp.read(path.join(__root, "hugv1.png"));
    let pathImg = path.join(__root, `hug_${one}_${two}.png`);
    let avatarOne = path.join(__root, `avt_${one}.png`);
    let avatarTwo = path.join(__root, `avt_${two}.png`);

    try {
      // تحميل الصور الشخصية
      let getAvatarOne = (
        await axios.get(
          `https://graph.facebook.com/${one}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`,
          { responseType: "arraybuffer" }
        )
      ).data;
      fs.writeFileSync(avatarOne, Buffer.from(getAvatarOne));

      let getAvatarTwo = (
        await axios.get(
          `https://graph.facebook.com/${two}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`,
          { responseType: "arraybuffer" }
        )
      ).data;
      fs.writeFileSync(avatarTwo, Buffer.from(getAvatarTwo));

      // إنشاء صور دائرية
      let circleOne = await jimp.read(await this.circle(avatarOne));
      let circleTwo = await jimp.read(await this.circle(avatarTwo));

      batgiam_img
        .composite(circleOne.resize(150, 150), 280, 100)
        .composite(circleTwo.resize(130, 130), 250, 280);

      let raw = await batgiam_img.getBufferAsync("image/png");
      fs.writeFileSync(pathImg, raw);

      // تنظيف الملفات المؤقتة
      fs.unlinkSync(avatarOne);
      fs.unlinkSync(avatarTwo);

      return pathImg;
    } catch (err) {
      console.error("Error making image:", err);
      throw err;
    }
  }

  async circle(image) {
    let img = await jimp.read(image);
    img.circle();
    return await img.getBufferAsync("image/png");
  }

  async execute({ api, event, args }) {
    const { threadID, messageID, senderID, messageReply, mentions } = event;

    try {
      let targetID = null;

      // 1️⃣ التحقق من الرد على رسالة أولاً
      if (messageReply && messageReply.senderID) {
        targetID = messageReply.senderID;
      }
      // 2️⃣ ثم التحقق من المنشن
      else {
        const mentionIds = Object.keys(mentions);
        if (mentionIds.length > 0) {
          targetID = mentionIds[0];
        }
      }

      if (!targetID) {
        return api.sendMessage(
          "⚠️ | لازم تاغ شخص أو رد على رسالته لتحضنه!",
          threadID,
          messageID
        );
      }

      // إنشاء الصورة
      const imagePath = await this.makeImage({
        one: senderID,
        two: targetID
      });

      // إرسال الصورة
      api.sendMessage(
        { body: "🫂🩷🐍 احضن!", attachment: fs.createReadStream(imagePath) },
        threadID,
        () => {
          try {
            fs.unlinkSync(imagePath);
          } catch (e) {}
        },
        messageID
      );
    } catch (err) {
      console.error("Error in hug command:", err);
      api.sendMessage(
        "❌ حدث خطأ في إنشاء الصورة. حاول مرة أخرى لاحقاً.",
        threadID,
        messageID
      );
    }
  }
}

export default new HugCommand();
