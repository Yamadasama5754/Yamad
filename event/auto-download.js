import axios from "axios";
import fs from "fs-extra";
import path from "path";

export default {
  name: "auto-download",
  description: "نظام التحميل التلقائي للروابط",
  execute: async ({ api, event, Threads }) => {
    try {
      // تجاهل رسائل الأوامر والرسائل الفارغة
      if (event.type !== "message" || !event.body || event.body.startsWith(".")) return;

      // جلب بيانات المجموعة
      const threadsData = await Threads.find(event.threadID);
      const autoDownloadEnabled = threadsData?.data?.autoDownload;

      console.log(`[Auto-DL] Group ${event.threadID}: ${autoDownloadEnabled ? "ENABLED" : "DISABLED"}`);

      if (!autoDownloadEnabled) return;

      const urlRegex = /(https?:\/\/[^\s]+)/g;
      let videoUrl = null;

      // البحث عن روابط في الرسالة الحالية
      const urls = event.body.match(urlRegex);
      if (urls && urls.length > 0) {
        videoUrl = urls[0];
      }

      // إذا لم نجد رابط في الرسالة، تحقق من الرسالة المردود عليها
      if (!videoUrl && event.messageReply && event.messageReply.body) {
        const replyUrls = event.messageReply.body.match(urlRegex);
        if (replyUrls && replyUrls.length > 0) {
          videoUrl = replyUrls[0];
        }
      }

      // إذا لم نجد رابط، تجاهل
      if (!videoUrl) return;

      console.log(`🔗 [Auto-DL] Detected URL: ${videoUrl}`);
      api.setMessageReaction("⏳", event.messageID, () => {}, true);
      
      await downloadVideoAuto({ api, event, videoUrl });

    } catch (error) {
      console.error("❌ Auto-download error:", error.message);
    }
  }
};

async function downloadVideoAuto({ api, event, videoUrl }) {
  const apiUrl = `https://neoaz.is-a.dev/api/alldl?url=${encodeURIComponent(videoUrl)}`;

  try {
    console.log(`📡 [Auto-DL] Fetching from API: ${videoUrl}`);
    
    const apiResponse = await axios.get(apiUrl, { 
      timeout: 60000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });
    
    const videoData = apiResponse.data;
    console.log(`📦 [Auto-DL] API Response:`, videoData);

    if (!videoData || !videoData.cdnUrl) {
      throw new Error(`API Error: Invalid response - ${JSON.stringify(videoData)}`);
    }

    const { title = "Video", source = "Unknown" } = videoData.data || {};
    const { cdnUrl } = videoData;

    console.log(`✅ [Auto-DL] Got CDN URL, downloading: ${title}`);

    const cacheDir = path.resolve("cache");
    await fs.ensureDir(cacheDir);

    const filename = `${Date.now()}_video.mp4`;
    const tempFilePath = path.join(cacheDir, filename);

    console.log(`💾 [Auto-DL] Saving to: ${tempFilePath}`);

    // Download file
    const response = await axios({
      method: "get",
      url: cdnUrl,
      responseType: "stream",
      timeout: 120000,
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });

    const writer = fs.createWriteStream(tempFilePath);
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
      setTimeout(() => reject(new Error("Download timeout")), 120000);
    });

    const stats = fs.statSync(tempFilePath);
    console.log(`📤 [Auto-DL] File saved: ${stats.size} bytes`);

    if (stats.size === 0) {
      throw new Error("Downloaded file is empty");
    }

    api.setMessageReaction("📤", event.messageID, () => {}, true);

    const fileStream = fs.createReadStream(tempFilePath);
    
    api.sendMessage(
      {
        body: `📹 ${title}\n🌐 ${source}`,
        attachment: fileStream
      },
      event.threadID,
      (err, info) => {
        setTimeout(() => {
          fs.unlink(tempFilePath, (e) => {
            if (e) console.error("[Auto-DL] Delete error:", e);
            else console.log(`[Auto-DL] Cleaned up: ${tempFilePath}`);
          });
        }, 3000);
        
        if (!err) {
          api.setMessageReaction("✅", event.messageID, () => {}, true);
          console.log(`✅ [Auto-DL] Sent successfully`);
        } else {
          api.setMessageReaction("❌", event.messageID, () => {}, true);
          console.error(`❌ [Auto-DL] Send failed:`, err);
        }
      }
    );

  } catch (error) {
    console.error("❌ [Auto-DL] Error:", error.message || error);
    api.setMessageReaction("❌", event.messageID, () => {}, true);
    
    api.sendMessage(
      `❌ فشل التحميل التلقائي\n${error.message}`,
      event.threadID
    );
  }
}
