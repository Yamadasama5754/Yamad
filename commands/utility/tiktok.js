import axios from "axios";
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class TikTokCommand {
  constructor() {
    this.name = "تيك";
    this.author = "Kim Joseph DG Bien & محسّن";
    this.cooldowns = 5;
    this.description = "ابحث عن فيديوهات التيك توك 🎥";
    this.role = 0;
    this.aliases = ["تيك", "tiktok", "تيكتوك"];
  }

  async execute({ api, event, args }) {
    try {
      api.setMessageReaction("🔍", event.messageID, (err) => {}, true);

      const query = args.join(" ");
      if (!query) {
        api.setMessageReaction("❌", event.messageID, (err) => {}, true);
        return api.sendMessage(
          "📋 الاستخدام: .تيك <كلمة البحث>\n💡 مثال: .تيك رقصة مشهورة",
          event.threadID,
          event.messageID
        );
      }

      // إرسال رسالة التحميل
      let loadingMessage;
      const response = await new Promise((resolve) => {
        api.sendMessage("⏱️ جاري البحث، يرجى الانتظار...", event.threadID, (err, info) => {
          if (info) {
            loadingMessage = info.messageID;
            resolve(info);
          }
        });
      });

      // البحث عن الفيديو
      const res = await axios.get(
        `https://hiroshi-api.onrender.com/tiktok/search?q=${encodeURIComponent(query)}`,
        { timeout: 15000 }
      );

      const videos = res.data?.data?.videos;

      if (!videos || videos.length === 0) {
        api.setMessageReaction("❌", loadingMessage, (err) => {}, true);
        return api.sendMessage(
          "❌ لم يتم العثور على أي فيديو",
          event.threadID,
          loadingMessage
        );
      }

      const video = videos[0];
      const videoUrl = video.play;

      const message = `✅ نتيجة البحث:

👤 الاسم: ${video.author.nickname}
🆔 المعرف: ${video.author.unique_id}

📄 العنوان: ${video.title}
💖 إعجابات: ${video.digg_count}
🗨️ تعليقات: ${video.comment_count}
🔁 مشاركات: ${video.share_count}
▶️ مشاهدات: ${video.play_count}`;

      // إنشاء مجلد الكاش
      const cacheDir = path.join(__dirname, "cache");
      fs.ensureDirSync(cacheDir);
      const filePath = path.join(cacheDir, `tiktok_${Date.now()}.mp4`);

      api.setMessageReaction("⬇️", loadingMessage, (err) => {}, true);

      // تحميل الفيديو بطريقة آمنة
      const videoResponse = await axios({
        method: "GET",
        url: videoUrl,
        responseType: "arraybuffer",
        timeout: 30000
      });

      fs.writeFileSync(filePath, Buffer.from(videoResponse.data));

      api.setMessageReaction("📤", loadingMessage, (err) => {}, true);

      // إرسال الفيديو
      api.sendMessage(
        {
          body: message,
          attachment: fs.createReadStream(filePath)
        },
        event.threadID,
        (err, info) => {
          // تنظيف الملف بعد الإرسال
          setTimeout(() => {
            try {
              if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
              }
            } catch (e) {}
          }, 3000);

          api.setMessageReaction("✅", loadingMessage, (err) => {}, true);
        },
        loadingMessage
      );

    } catch (error) {
      console.error("[TIKTOK] خطأ:", error.message);
      api.setMessageReaction("❌", event.messageID, (err) => {}, true);
      api.sendMessage(
        `❌ حدث خطأ: ${error.message}`,
        event.threadID,
        event.messageID
      );
    }
  }
}

export default new TikTokCommand();
