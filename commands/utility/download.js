import axios from "axios";
import fs from "fs-extra";
import path from "path";

class Download {
  constructor() {
    this.name = "تحميل";
    this.author = "Yamada KJ & Alastor";
    this.cooldowns = 5;
    this.description = "تحميل الفيديوهات من مواقع مختلفة | الاستخدام: تحميل [رابط] أو تحميل تلقائي (toggle)";
    this.role = 0;
    this.aliases = ["تحميل", "download", "alldl"];
  }

  async execute({ api, event, args, Threads }) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;

    // معالجة toggle التحميل التلقائي
    if (args[0] === "تلقائي") {
      try {
        const threadInfo = await api.getThreadInfo(event.threadID);
        const isAdmin = threadInfo.adminIDs.map(a => a.id).includes(event.senderID);
        
        if (!isAdmin) {
          return api.sendMessage(
            "❌ ليس لديك صلاحية تفعيل/تعطيل التحميل التلقائي",
            event.threadID,
            event.messageID
          );
        }

        const threadsData = await Threads.find(event.threadID);
        const currentState = threadsData?.data?.autoDownload || false;
        const newState = !currentState;
        
        console.log(`🔄 Toggle auto-download: ${currentState} -> ${newState}`);
        
        const result = await Threads.update(event.threadID, {
          autoDownload: newState
        });
        
        console.log(`✅ Update result:`, result);

        return api.sendMessage(
          `✅ التحميل التلقائي الآن: ${newState ? "🟢 مفعل" : "🔴 معطل"}`,
          event.threadID,
          event.messageID
        );
      } catch (err) {
        console.error("Error toggling auto-download:", err);
        return api.sendMessage(`❌ حدث خطأ: ${err.message}`, event.threadID);
      }
    }

    // معالجة تحميل الفيديو
    let videoUrl = args.join(" ");

    if (!videoUrl) {
      if (event.messageReply && event.messageReply.body) {
        const foundURLs = event.messageReply.body.match(urlRegex);
        if (foundURLs && foundURLs.length > 0) {
          videoUrl = foundURLs[0];
        }
      }
    }

    if (!videoUrl || !videoUrl.match(urlRegex)) {
      return api.sendMessage(
        "❌ استخدام خاطئ!\n\n📝 الطرق الصحيحة:\n• تحميل [الرابط]\n• تحميل تلقائي",
        event.threadID,
        event.messageID
      );
    }

    api.setMessageReaction("⏳", event.messageID, () => {}, true);
    await this.downloadVideo({ api, event, videoUrl });
  }

  async downloadVideo({ api, event, videoUrl }) {
    const apiUrl = `https://neoaz.is-a.dev/api/alldl?url=${encodeURIComponent(videoUrl)}`;

    try {
      const apiResponse = await axios.get(apiUrl, { timeout: 60000 });
      const videoData = apiResponse.data;

      if (!videoData || !videoData.cdnUrl || !videoData.data || !videoData.data.title) {
        throw new Error("استجابة غير صحيحة من الخادم");
      }

      const { title, source } = videoData.data;
      const { cdnUrl } = videoData;

      const videoStreamResponse = await axios({
        method: "get",
        url: cdnUrl,
        responseType: "stream",
        timeout: 60000
      });

      const cacheDir = path.resolve("cache");
      await fs.ensureDir(cacheDir);

      const filename = `${Date.now()}_${title.substring(0, 20).replace(/[^a-z0-9]/gi, "_")}.mp4`;
      const tempFilePath = path.join(cacheDir, filename);

      const writer = fs.createWriteStream(tempFilePath);
      videoStreamResponse.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
      });

      api.setMessageReaction("✅", event.messageID, () => {}, true);

      const fileStream = fs.createReadStream(tempFilePath);
      await api.sendMessage(
        {
          body: `📹 العنوان: ${title}\n🌐 المنصة: ${source}`,
          attachment: fileStream
        },
        event.threadID
      );

      setTimeout(() => {
        fs.unlink(tempFilePath, (err) => {
          if (err) console.error("Error deleting temp file:", err);
        });
      }, 1000);

    } catch (error) {
      console.error("Download Error:", error.message || error);
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      api.sendMessage(
        `❌ حدث خطأ أثناء التحميل: ${error.message || "فشل التحميل"}`,
        event.threadID
      );
    }
  }
}

export default new Download();
