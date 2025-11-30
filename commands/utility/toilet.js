import fs from "fs-extra";
import axios from "axios";
import jimp from "jimp";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class ToiletCommand {
  constructor() {
    this.name = "مرحاض";
    this.author = "kaguya project";
    this.cooldowns = 5;
    this.description = "يقوم بإنشاء صورة معالجة معينة 🚽";
    this.role = 0;
    this.aliases = ["مرحاض", "toilet", "حمام"];
  }

  async onLoad() {
    console.log("[TOILET] تم تحضير أمر المرحاض بنجاح");
  }

  async createImage(targetID) {
    try {
      const cacheDir = path.join(__dirname, "cache");
      fs.ensureDirSync(cacheDir);

      // تحميل صورة الهدف فقط
      const avTarget = await jimp.read(
        `https://graph.facebook.com/${targetID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`
      );
      avTarget.circle();

      // تحميل الخلفية من imgur
      const img = await jimp.read("https://i.imgur.com/sZW2vlz.png");

      // تعديل حجم الخلفية والصور - فقط صورة الهدف في المرحاض
      img
        .resize(1080, 1350)
        .composite(avTarget.resize(450, 450), 300, 660); // الشخص المرد عليه فقط

      const pth = path.join(cacheDir, `toilet_${Date.now()}.png`);
      await img.writeAsync(pth);

      return pth;
    } catch (err) {
      console.error("[TOILET] خطأ في إنشاء الصورة:", err);
      throw err;
    }
  }

  async execute({ api, event, args }) {
    try {
      api.setMessageReaction("⏳", event.messageID, (err) => {}, true);

      let senderID = event.senderID;
      let targetID = null;

      // 1. التحقق من الرد على رسالة
      if (event.messageReply) {
        targetID = event.messageReply.senderID;
      }

      // 2. التحقق من المنشن
      const mentions = Object.keys(event.mentions || {});

      if (mentions.length === 0 && !targetID) {
        api.setMessageReaction("❌", event.messageID, (err) => {}, true);
        return api.sendMessage(
          "⚠️ | المرجو عمل منشن للشخص الذي تريد أن يكون وجهه في المرحاض\n💡 أو رد على رسالة شخص",
          event.threadID,
          event.messageID
        );
      }

      api.setMessageReaction("🎨", event.messageID, (err) => {}, true);

      // إذا كان هناك منشن واحد فقط
      if (mentions.length === 1 && !targetID) {
        targetID = mentions[0];
      }
      // إذا كان هناك منشنين
      else if (mentions.length >= 2) {
        targetID = mentions[0];
      }

      const imagePath = await this.createImage(targetID);

      api.setMessageReaction("📤", event.messageID, (err) => {}, true);

      api.sendMessage(
        {
          body: "🚽 أنت تستحق هذا المكان يا وجه المرحاض 😂",
          attachment: fs.createReadStream(imagePath)
        },
        event.threadID,
        (err, info) => {
          setTimeout(() => {
            try {
              if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
              }
            } catch (e) {}
          }, 2000);

          api.setMessageReaction("✅", event.messageID, (err) => {}, true);
        },
        event.messageID
      );

    } catch (error) {
      console.error("[TOILET] خطأ:", error);
      api.setMessageReaction("❌", event.messageID, (err) => {}, true);
      api.sendMessage(
        `❌ حدث خطأ: ${error.message}`,
        event.threadID,
        event.messageID
      );
    }
  }
}

export default new ToiletCommand();
