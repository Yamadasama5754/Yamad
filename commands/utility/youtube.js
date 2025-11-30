import axios from "axios";
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class YouTubeCommand {
  constructor() {
    this.name = "يوتيب";
    this.author = "CatalizCS mod video";
    this.cooldowns = 10;
    this.description = "تشغيل فيديوهات من اليوتيوب 🎥";
    this.role = 0;
    this.aliases = ["يوتيب", "يوتيوب", "فيديو"];
  }

  async onLoad() {
    console.log("[YOUTUBE] تم تحضير أمر يوتيوب بنجاح");
  }

  async execute({ api, event, args }) {
    try {
      if (!args[0]) {
        api.setMessageReaction("❌", event.messageID, (err) => {}, true);
        return api.sendMessage(
          "⚠️ | يرجى إدخال اسم الفيديو للبحث.\n💡 مثال: .يوتيب رقصة مشهورة",
          event.threadID,
          event.messageID
        );
      }

      api.setMessageReaction("🔍", event.messageID, (err) => {}, true);

      const query = args.join(" ");
      const apiKey = "AIzaSyC_CVzKGFtLAqxNdAZ_EyLbL0VRGJ-FaMU";
      const apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&key=${apiKey}&type=video&maxResults=6`;

      const res = await axios.get(apiUrl, { timeout: 15000 });
      const results = res.data.items;

      if (!results || results.length === 0) {
        api.setMessageReaction("❌", event.messageID, (err) => {}, true);
        return api.sendMessage(
          "❌ | لم يتم العثور على أي نتائج.",
          event.threadID,
          event.messageID
        );
      }

      const searchResults = results.slice(0, 4);
      let message = "🎥 نتائج البحث:\n\n";
      const attachments = [];
      const cacheDir = path.join(__dirname, "cache");
      fs.ensureDirSync(cacheDir);

      for (let i = 0; i < searchResults.length; i++) {
        const result = searchResults[i];
        const title = result.snippet.title;
        const channelTitle = result.snippet.channelTitle;

        message += `${i + 1}. ${title}\nالقناة: ${channelTitle}\n--------------------------\n`;

        try {
          const imageUrl = result.snippet.thumbnails.high.url;
          const imageBuffer = await axios.get(imageUrl, {
            responseType: "arraybuffer",
            timeout: 10000
          });
          const imagePath = path.join(cacheDir, `thumb_${Date.now()}_${i + 1}.jpg`);
          fs.writeFileSync(imagePath, Buffer.from(imageBuffer.data));
          attachments.push({ path: imagePath });
        } catch (imgErr) {
          console.warn(`[YOUTUBE] فشل تحميل الصورة ${i + 1}:`, imgErr.message);
        }
      }

      api.setMessageReaction("📋", event.messageID, (err) => {}, true);

      api.sendMessage(
        {
          body: message + "\n👆 قم بالرد برقم الفيديو الذي تريد تحميله (1-4).",
          attachment: attachments.map(att => fs.createReadStream(att.path))
        },
        event.threadID,
        (err, info) => {
          if (!global.client) global.client = {};
          if (!global.client.handleReply) global.client.handleReply = [];

          global.client.handleReply.push({
            name: this.name,
            messageID: info.messageID,
            author: event.senderID,
            searchResults,
            attachments
          });

          setTimeout(() => {
            try {
              attachments.forEach(att => {
                if (fs.existsSync(att.path)) {
                  fs.unlinkSync(att.path);
                }
              });
            } catch (e) {}
          }, 15000);
        },
        event.messageID
      );

    } catch (error) {
      console.error("[YOUTUBE] خطأ:", error);
      api.setMessageReaction("❌", event.messageID, (err) => {}, true);
      api.sendMessage(
        `⛔ | حدث خطأ أثناء البحث: ${error.message}`,
        event.threadID,
        event.messageID
      );
    }
  }

  async handleReply({ api, event, handleReply }) {
    try {
      const index = parseInt(event.body) - 1;

      if (isNaN(index) || index < 0 || index >= handleReply.searchResults.length) {
        api.setMessageReaction("❌", event.messageID, (err) => {}, true);
        return api.sendMessage(
          "❌ | الرجاء إدخال رقم صحيح من النتائج.",
          event.threadID,
          event.messageID
        );
      }

      const selectedVideo = handleReply.searchResults[index];
      const videoId = selectedVideo.id.videoId;
      const title = selectedVideo.snippet.title;

      api.setMessageReaction("⏱️", event.messageID, (err) => {}, true);

      api.sendMessage(
        `⏱️ | جاري تنزيل الفيديو: ${title}\nقد يستغرق هذا بعض الوقت، يرجى الانتظار...`,
        event.threadID,
        event.messageID
      );

      const res = await axios.get(
        `https://nayan-video-downloader.vercel.app/alldown?url=https://www.youtube.com/watch?v=${videoId}`,
        { timeout: 30000 }
      );

      const downloadLink = res.data.data.high;
      const cacheDir = path.join(__dirname, "cache");
      fs.ensureDirSync(cacheDir);
      const filePath = path.join(cacheDir, `video_${Date.now()}.mp4`);

      api.setMessageReaction("⬇️", event.messageID, (err) => {}, true);

      const videoStream = await axios({
        url: downloadLink,
        method: "GET",
        responseType: "stream",
        timeout: 60000
      });

      videoStream.data
        .pipe(fs.createWriteStream(filePath))
        .on("close", () => {
          const fileSize = fs.statSync(filePath).size;

          if (fileSize > 26214400) {
            api.setMessageReaction("⚠️", event.messageID, (err) => {}, true);
            api.sendMessage(
              "⚠️ | تعذر إرسال الفيديو لأن حجمه يتجاوز 25 ميغابايت.",
              event.threadID,
              (err) => {
                try {
                  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                } catch (e) {}
              },
              event.messageID
            );
          } else {
            api.setMessageReaction("📤", event.messageID, (err) => {}, true);

            api.sendMessage(
              {
                body: `✅ ${title}`,
                attachment: fs.createReadStream(filePath)
              },
              event.threadID,
              (err, info) => {
                setTimeout(() => {
                  try {
                    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                  } catch (e) {}
                }, 3000);

                api.setMessageReaction("✅", event.messageID, (err) => {}, true);
              },
              event.messageID
            );
          }

          // تنظيف الصور المؤقتة
          try {
            if (handleReply.attachments) {
              handleReply.attachments.forEach(att => {
                if (fs.existsSync(att.path)) {
                  fs.unlinkSync(att.path);
                }
              });
            }
          } catch (e) {}
        })
        .on("error", (error) => {
          console.error("[YOUTUBE] خطأ في التنزيل:", error);
          api.setMessageReaction("❌", event.messageID, (err) => {}, true);
          api.sendMessage(
            `⛔ | خطأ أثناء التنزيل: ${error.message}`,
            event.threadID,
            (err) => {
              try {
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
              } catch (e) {}
            },
            event.messageID
          );
        });

    } catch (error) {
      console.error("[YOUTUBE] خطأ في handleReply:", error);
      api.setMessageReaction("❌", event.messageID, (err) => {}, true);
      api.sendMessage(
        `⛔ | حدث خطأ أثناء تنفيذ الطلب: ${error.message}`,
        event.threadID,
        event.messageID
      );
    }
  }
}

export default new YouTubeCommand();
