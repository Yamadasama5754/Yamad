import axios from "axios";
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";
import shaonDownloader from "shaon-videos-downloader";

const { alldown } = shaonDownloader;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class AutoDownloaderCommand {
  constructor() {
    this.name = "اوتو";
    this.author = "SHAON";
    this.cooldowns = 5;
    this.description = "تنزيل الفيديوهات تلقائياً من الروابط 🎬";
    this.role = 0;
    this.aliases = ["اوتو", "auto", "تنزيل"];
  }

  async onLoad() {
    console.log("[AUTO] تم تحضير أمر التنزيل التلقائي بنجاح");
  }

  async downloadVideo(url) {
    try {
      const data = await alldown(url);
      
      if (!data || !data.url) {
        throw new Error("فشل في الحصول على رابط الفيديو");
      }

      const videoUrl = data.url;
      const videoBuffer = (
        await axios.get(videoUrl, { 
          responseType: "arraybuffer",
          timeout: 60000 
        })
      ).data;

      const cacheDir = path.join(__dirname, "cache");
      fs.ensureDirSync(cacheDir);
      
      const filePath = path.join(cacheDir, `auto_${Date.now()}.mp4`);
      fs.writeFileSync(filePath, Buffer.from(videoBuffer));

      return filePath;
    } catch (err) {
      console.error("[AUTO] خطأ في التنزيل:", err);
      throw err;
    }
  }

  async execute({ api, event, args }) {
    try {
      let url = null;

      // 1. التحقق من المنشن أو الرد
      if (event.messageReply) {
        url = event.messageReply.body;
      }

      // 2. التحقق من الروابط المرسلة في args
      if (!url && args.length > 0) {
        url = args.join(" ");
      }

      // 3. التحقق من الروابط في الرسالة الحالية
      if (!url) {
        url = event.body;
      }

      if (!url || !url.startsWith("http")) {
        api.setMessageReaction("❌", event.messageID, (err) => {}, true);
        return api.sendMessage(
          "⚠️ | أرسل رابط فيديو أو اكتب اوتو ورابط\n💡 مثال: .اوتو https://www.facebook.com/video...",
          event.threadID,
          event.messageID
        );
      }

      api.setMessageReaction("⏳", event.messageID, (err) => {}, true);

      api.sendMessage(
        "⏳ يرجى الانتظار، جاري تحميل الفيديو...",
        event.threadID,
        event.messageID
      );

      api.setMessageReaction("📥", event.messageID, (err) => {}, true);

      const filePath = await this.downloadVideo(url);

      api.setMessageReaction("📤", event.messageID, (err) => {}, true);

      api.sendMessage(
        {
          body: "🔥🚀 KAGUYA-BOT | 🔥💻\n📥⚡ اوتو دونلودر ⚡📂\n🎬 تمتع بالفيديو الخاص بك!",
          attachment: fs.createReadStream(filePath)
        },
        event.threadID,
        (err, info) => {
          setTimeout(() => {
            try {
              if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
              }
            } catch (e) {}
          }, 3000);

          api.setMessageReaction("✅", event.messageID, (err) => {}, true);
        },
        event.messageID
      );

    } catch (error) {
      console.error("[AUTO] خطأ:", error);
      api.setMessageReaction("❌", event.messageID, (err) => {}, true);
      api.sendMessage(
        `❌ فشل تنزيل الفيديو: ${error.message}`,
        event.threadID,
        event.messageID
      );
    }
  }
}

export default new AutoDownloaderCommand();
