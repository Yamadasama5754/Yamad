import axios from "axios";
import pkg from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";

const { createReadStream, createWriteStream, unlinkSync, statSync, writeFileSync } = pkg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

class YouTubeCommand {
  constructor() {
    this.name = "يوتيوب";
    this.author = "CatalizCS mod video by Đăng";
    this.cooldowns = 10;
    this.description = "تشغيل فيديوهات من اليوتيوب";
    this.role = 0;
    this.aliases = ["يوتيوب", "youtube", "فيديو"];
  }

  async execute({ api, event, args }) {
    try {
      if (!args[0]) {
        return api.sendMessage(
          "⚠️ | يرجى إدخال اسم الفيديو للبحث.",
          event.threadID,
          event.messageID
        );
      }

      const query = args.join(" ");
      const apiKey = "AIzaSyC_CVzKGFtLAqxNdAZ_EyLbL0VRGJ-FaMU";
      const apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&key=${apiKey}&type=video&maxResults=6`;

      const res = await axios.get(apiUrl);
      const results = res.data.items;

      if (!results || results.length === 0) {
        return api.sendMessage(
          "❌ | لم يتم العثور على أي نتائج.",
          event.threadID,
          event.messageID
        );
      }

      const searchResults = results.slice(0, 4);
      let message = "🎥 نتائج البحث:\n\n";
      const attachments = [];

      for (let i = 0; i < searchResults.length; i++) {
        const result = searchResults[i];
        const title = result.snippet.title;
        const channelTitle = result.snippet.channelTitle;

        message += `${i + 1}. ${title}\nالقناة: ${channelTitle}\n--------------------------\n`;

        try {
          const imageUrl = result.snippet.thumbnails.high.url;
          const imageBuffer = await axios.get(imageUrl, {
            responseType: "arraybuffer"
          });
          const imagePath = path.join(__dirname, `cache/thumb_${i + 1}.jpg`);
          writeFileSync(imagePath, Buffer.from(imageBuffer.data));
          attachments.push(createReadStream(imagePath));
        } catch (imgErr) {
          console.warn(`[YOUTUBE] فشل تحميل الصورة ${i + 1}:`, imgErr.message);
        }
      }

      api.sendMessage(
        {
          body:
            message +
            "\n👆 قم بالرد برقم الفيديو الذي تريد تحميله.",
          attachment: attachments
        },
        event.threadID,
        (err, info) => {
          if (!global.client?.handler?.reply) {
            if (!global.client) global.client = {};
            if (!global.client.handler) global.client.handler = {};
            global.client.handler.reply = new Map();
          }

          global.client.handler.reply.set(info.messageID, {
            name: this.name,
            searchResults,
            attachments
          });

          setTimeout(() => {
            try {
              global.client.handler.reply.delete(info.messageID);
              attachments.forEach((file) => {
                // الملفات محذوفة بالفعل
              });
            } catch (e) {}
          }, 10000);
        },
        event.messageID
      );
    } catch (err) {
      console.error("[YOUTUBE] خطأ:", err);
      api.sendMessage(
        `⛔ | حدث خطأ أثناء البحث: ${err.message}`,
        event.threadID,
        event.messageID
      );
    }
  }

  async onReply({ api, event, reply }) {
    try {
      const selectedVideo = reply.searchResults[event.body - 1];

      if (!selectedVideo) {
        return api.sendMessage(
          "❌ | الرجاء إدخال رقم صحيح من النتائج.",
          event.threadID,
          event.messageID
        );
      }

      const videoId = selectedVideo.id.videoId;
      const title = selectedVideo.snippet.title;

      api.sendMessage(
        `⏱️ | جاري تنزيل الفيديو: ${title}\nقد يستغرق هذا بعض الوقت، يرجى الانتظار...`,
        event.threadID,
        async (err, info) => {
          setTimeout(() => api.unsendMessage(info.messageID), 20000);
        }
      );

      try {
        // رابط التنزيل الجديد
        const res = await axios.get(
          `https://nayan-video-downloader.vercel.app/alldown?url=https://www.youtube.com/watch?v=${videoId}`
        );
        const downloadLink = res.data.data.high;

        const filePath = path.join(__dirname, `cache/video.mp4`);

        const videoStream = await axios({
          url: downloadLink,
          method: "GET",
          responseType: "stream",
          timeout: 120000
        });

        videoStream.data
          .pipe(createWriteStream(filePath))
          .on("close", () => {
            if (statSync(filePath).size > 26214400) {
              api.sendMessage(
                "⚠️ | تعذر إرسال الفيديو لأن حجمه يتجاوز 25 ميغابايت.",
                event.threadID,
                () => unlinkSync(filePath)
              );
            } else {
              api.sendMessage(
                { body: title, attachment: createReadStream(filePath) },
                event.threadID,
                () => unlinkSync(filePath)
              );
            }
          })
          .on("error", (error) => {
            api.sendMessage(
              `⛔ | خطأ أثناء التنزيل: ${error.message}`,
              event.threadID
            );
          });
      } catch (downloadErr) {
        console.error("[YOUTUBE] خطأ في التنزيل:", downloadErr);
        api.sendMessage(
          `⛔ | خطأ أثناء التنزيل: ${downloadErr.message}`,
          event.threadID
        );
      }
    } catch (e) {
      console.error("[YOUTUBE] خطأ في onReply:", e);
      api.sendMessage(
        "⛔ | حدث خطأ أثناء تنفيذ الطلب!",
        event.threadID
      );
    }
  }
}

export default new YouTubeCommand();
