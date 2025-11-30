import axios from "axios";
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";
import jimp from "jimp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class SlapCommand {
  constructor() {
    this.name = "اصفعي";
    this.author = "عمر & محسّن";
    this.cooldowns = 5;
    this.description = "تصفع شخص بمنشن أو رد على رسالته 👋";
    this.role = 0;
    this.aliases = ["اصفعي", "slap", "صفعة"];
  }

  async onLoad() {
    const cacheDir = path.join(__dirname, "cache/canvas");
    const imagePath = path.join(cacheDir, "sato.png");

    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }

    if (!fs.existsSync(imagePath)) {
      try {
        const response = await axios.get("https://i.imgur.com/dsrmtlg.jpg", {
          responseType: "arraybuffer",
          timeout: 10000
        });
        fs.writeFileSync(imagePath, Buffer.from(response.data));
      } catch (err) {
        console.warn("[SLAP] خطأ في تحميل الصورة الأساسية:", err.message);
      }
    }
  }

  async makeCircle(imagePath) {
    try {
      let image = await jimp.read(imagePath);
      image.circle();
      return await image.getBufferAsync("image/png");
    } catch (err) {
      console.error("[SLAP] خطأ في makeCircle:", err);
      throw err;
    }
  }

  async makeImage({ one, two }) {
    const cacheDir = path.join(__dirname, "cache/canvas");
    fs.ensureDirSync(cacheDir);

    let baseImg = await jimp.read(path.join(cacheDir, "sato.png"));
    let outputPath = path.join(cacheDir, `sato_${one}_${two}.png`);
    let avatarOne = path.join(cacheDir, `avt_slap_${one}.png`);
    let avatarTwo = path.join(cacheDir, `avt_slap_${two}.png`);

    try {
      // تحميل صور الملفات الشخصية
      let avatarOneData = (
        await axios.get(
          `https://graph.facebook.com/${one}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`,
          { responseType: "arraybuffer", timeout: 10000 }
        )
      ).data;
      fs.writeFileSync(avatarOne, Buffer.from(avatarOneData));

      let avatarTwoData = (
        await axios.get(
          `https://graph.facebook.com/${two}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`,
          { responseType: "arraybuffer", timeout: 10000 }
        )
      ).data;
      fs.writeFileSync(avatarTwo, Buffer.from(avatarTwoData));

      // إنشاء دوائر
      let circleOne = await jimp.read(await this.makeCircle(avatarOne));
      let circleTwo = await jimp.read(await this.makeCircle(avatarTwo));

      // دمج الصور على الصورة الأساسية
      baseImg
        .composite(circleOne.resize(150, 150), 80, 190)
        .composite(circleTwo.resize(150, 150), 260, 80);

      let raw = await baseImg.getBufferAsync("image/png");
      fs.writeFileSync(outputPath, raw);

      // تنظيف الملفات المؤقتة
      fs.unlinkSync(avatarOne);
      fs.unlinkSync(avatarTwo);

      return outputPath;
    } catch (err) {
      console.error("[SLAP] خطأ في makeImage:", err);
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
          "❌ صفّع مين؟\n💡 منشن شخص أو رد على رسالته",
          threadID,
          messageID
        );
      }

      api.setMessageReaction("🎨", event.messageID, (err) => {}, true);

      let imagePath = await this.makeImage({
        one: String(senderID),
        two: String(targetID)
      });

      api.sendMessage(
        { attachment: fs.createReadStream(imagePath) },
        threadID,
        (err, info) => {
          setTimeout(() => {
            if (fs.existsSync(imagePath)) {
              fs.unlinkSync(imagePath);
            }
          }, 1000);
        }
      );

      api.setMessageReaction("✅", event.messageID, (err) => {}, true);

    } catch (error) {
      console.error("[SLAP] خطأ:", error);
      api.setMessageReaction("❌", event.messageID, (err) => {}, true);
      api.sendMessage(
        `❌ حدث خطأ: ${error.message}`,
        event.threadID,
        event.messageID
      );
    }
  }
}

export default new SlapCommand();
