import axios from "axios";
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
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
          "⚠️ | يرجى إدخال اسم الفيديو للبحث.\n💡 مثال: .يوتيب رقصة مشهورة\n🎵 أو مع نوع: .يوتيب صوت اسم الأغنية",
          event.threadID,
          event.messageID
        );
      }

      api.setMessageReaction("🔍", event.messageID, (err) => {}, true);

      // تحديد نوع التنزيل (فيديو أو صوت)
      let downloadType = "video"; // الافتراضي
      let queryArgs = args;

      if (args[0] === "صوت" || args[0] === "audio") {
        downloadType = "audio";
        queryArgs = args.slice(1);
      } else if (args[0] === "فيديو" || args[0] === "video") {
        downloadType = "video";
        queryArgs = args.slice(1);
      }

      if (queryArgs.length === 0) {
        api.setMessageReaction("❌", event.messageID, (err) => {}, true);
        return api.sendMessage(
          "⚠️ | يرجى إدخال اسم الفيديو/الأغنية للبحث.\n💡 مثال: .يوتيب رقصة مشهورة\n🎵 أو: .يوتيب صوت اسم الأغنية",
          event.threadID,
          event.messageID
        );
      }

      const query = queryArgs.join(" ");
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
      let message = downloadType === "audio" ? "🎵 نتائج البحث (صوت):\n\n" : "🎥 نتائج البحث:\n\n";
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
          body: message + (downloadType === "audio" ? "\n👆 قم بالرد برقم الأغنية الذي تريد تحميلها (1-4)." : "\n👆 قم بالرد برقم الفيديو الذي تريد تحميله (1-4)."),
          attachment: attachments.map(att => fs.createReadStream(att.path))
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
            attachments,
            downloadType
          });

          setTimeout(() => {
            try {
              global.client.handler.reply.delete(info.messageID);
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

  async onReply({ api, event, reply }) {
    try {
      const index = parseInt(event.body) - 1;
      
      // الحصول على البيانات المخزنة
      let replyData = reply;
      
      // إذا لم تكن البيانات موجودة في reply مباشرة، حاول الحصول عليها من handler
      if (!replyData || !replyData.searchResults) {
        if (event.messageReply && global.client?.handler?.reply) {
          replyData = global.client.handler.reply.get(event.messageReply.messageID);
        }
      }

      if (!replyData || !replyData.searchResults) {
        api.setMessageReaction("❌", event.messageID, (err) => {}, true);
        return api.sendMessage(
          "❌ | انتهت صلاحية البحث. يرجى محاولة البحث مرة أخرى.",
          event.threadID,
          event.messageID
        );
      }

      if (isNaN(index) || index < 0 || index >= replyData.searchResults.length) {
        api.setMessageReaction("❌", event.messageID, (err) => {}, true);
        return api.sendMessage(
          "❌ | الرجاء إدخال رقم صحيح من النتائج.",
          event.threadID,
          event.messageID
        );
      }

      const selectedVideo = replyData.searchResults[index];
      const videoId = selectedVideo.id.videoId;
      const title = selectedVideo.snippet.title;
      const downloadType = replyData.downloadType || "video";

      api.setMessageReaction("⏱️", event.messageID, (err) => {}, true);

      const downloadMessage = downloadType === "audio" 
        ? `⏱️ | جاري تنزيل الأغنية: ${title}\nقد يستغرق هذا بعض الوقت، يرجى الانتظار...`
        : `⏱️ | جاري تنزيل الفيديو: ${title}\nقد يستغرق هذا بعض الوقت، يرجى الانتظار...`;

      api.sendMessage(
        downloadMessage,
        event.threadID,
        event.messageID
      );

      const res = await axios.get(
        `https://nayan-video-downloader.vercel.app/alldown?url=https://www.youtube.com/watch?v=${videoId}`,
        { timeout: 30000 }
      );

      const cacheDir = path.join(__dirname, "cache");
      fs.ensureDirSync(cacheDir);
      const videoPath = path.join(cacheDir, `video_${Date.now()}.mp4`);
      const audioPath = path.join(cacheDir, `audio_${Date.now()}.mp3`);

      api.setMessageReaction("⬇️", event.messageID, (err) => {}, true);

      // اختر رابط التنزيل حسب نوع الملف
      const downloadLink = downloadType === "audio" 
        ? (res.data.data.audio || res.data.data.high)  // حاول الصوت أولاً
        : res.data.data.high;  // الفيديو
      
      const filePath = downloadType === "audio" ? audioPath : videoPath;

      const videoStream = await axios({
        url: downloadLink,
        method: "GET",
        responseType: "stream",
        timeout: 60000
      });

      videoStream.data
        .pipe(fs.createWriteStream(filePath))
        .on("close", async () => {
          try {
            let finalPath = filePath;
            let finalSize = fs.statSync(filePath).size;

            const fileSize = finalSize;

            if (fileSize > 26214400) {
              api.setMessageReaction("⚠️", event.messageID, (err) => {}, true);
              const sizeWarning = downloadType === "audio"
                ? "⚠️ | تعذر إرسال الأغنية لأن حجمها يتجاوز 25 ميغابايت."
                : "⚠️ | تعذر إرسال الفيديو لأن حجمه يتجاوز 25 ميغابايت.";
              api.sendMessage(
                sizeWarning,
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
                  attachment: fs.createReadStream(finalPath)
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
              if (replyData.attachments) {
                replyData.attachments.forEach(att => {
                  if (fs.existsSync(att.path)) {
                    fs.unlinkSync(att.path);
                  }
                });
              }
            } catch (e) {}
          } catch (innerErr) {
            console.error("[YOUTUBE] خطأ في معالجة الملف:", innerErr);
            api.setMessageReaction("❌", event.messageID, (err) => {}, true);
            api.sendMessage(
              `⛔ | حدث خطأ: ${innerErr.message}`,
              event.threadID,
              event.messageID
            );
            try {
              if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            } catch (e) {}
          }
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
      console.error("[YOUTUBE] خطأ في onReply:", error);
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
