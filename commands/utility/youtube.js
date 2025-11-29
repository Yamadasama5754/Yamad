import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';
import yts from 'yt-search';

class YouTube {
  constructor() {
    this.name = "يوتيوب";
    this.author = "Yamada KJ & Alastor";
    this.cooldowns = 60;
    this.description = "تنزيل مقطع من YouTube";
    this.role = 0;
    this.aliases = ["يوتيب", "فيديو", "مقطع"];
  }

  async execute({ api, event }) {
    const input = event.body;
    const data = input.split(" ");

    if (data.length < 2) {
      return api.sendMessage("⚠️ | أرجوك قم بإدخال اسم المقطع.\n\n📝 | الاستخدام:\n• يوتيوب [اسم المقطع]", event.threadID);
    }

    data.shift();
    let videoName = data.join(" ");

    if (!videoName) {
      return api.sendMessage("⚠️ | أرجوك قم بإدخال اسم المقطع.", event.threadID);
    }

    try {
      const sentMessage = await api.sendMessage(`✔ | جاري البحث عن المقطع المطلوب "${videoName}". المرجو الانتظار...`, event.threadID);

      // البحث عن الفيديوهات باستخدام yt-search
      console.log(`🔍 البحث عن الفيديو في YouTube: ${videoName}`);

      const results = await yts(videoName);
      const videos = results.videos.slice(0, 4);
      
      if (!videos || videos.length === 0) {
        api.unsendMessage(sentMessage.messageID);
        return api.sendMessage("⚠️ | لم يتم العثور على أي نتائج.", event.threadID);
      }

      let msg = `🎥 | تم العثور على المقاطع التالية:\n\n`;

      const numberSymbols = ['⓵', '⓶', '⓷', '⓸'];

      for (let i = 0; i < videos.length; i++) {
        const video = videos[i];
        const videoIndex = numberSymbols[i];
        
        msg += `${videoIndex} ❀ العنوان: ${video.title}\n`;
        msg += `   📺 القناة: ${video.author.name}\n`;
        msg += `   ⏱️ المدة: ${video.duration.shortFormat}\n\n`;
      }

      msg += '📥 | الرجاء الرد برقم المقطع الذي تود تنزيله.';

      api.unsendMessage(sentMessage.messageID);

      api.sendMessage(msg, event.threadID, (error, info) => {
        if (error) return console.error(error);

        global.client.handler.reply.set(info.messageID, {
          author: event.senderID,
          type: "pick",
          name: "يوتيوب",
          searchResults: videos,
          unsend: true
        });
      });

    } catch (error) {
      console.error('[ERROR]', error);
      api.sendMessage('🥱 ❀ حدث خطأ أثناء معالجة الأمر.\nتأكد من اسم المقطع وحاول مجدداً.', event.threadID);
    }
  }

  async onReply({ api, event, reply }) {
    if (reply.type !== 'pick') return;

    const { author, searchResults } = reply;

    if (event.senderID !== author) {
      return api.sendMessage("⚠️ | هذا ليس لك.", event.threadID);
    }

    const selectedIndex = parseInt(event.body, 10) - 1;

    if (isNaN(selectedIndex) || selectedIndex < 0 || selectedIndex >= searchResults.length) {
      return api.sendMessage("❌ | الرد غير صالح. يرجى الرد برقم صحيح.", event.threadID);
    }

    const video = searchResults[selectedIndex];

    try {
      api.sendMessage(`⬇️ | جاري تحميل الفيديو، المرجو الانتظار...\n⏱️ قد يستغرق عدة دقائق...`, event.threadID);

      await this.downloadYouTube(video.url, api, event, video);

    } catch (error) {
      console.error('[ERROR]', error);
      api.sendMessage('🥱 ❀ حدث خطأ أثناء تحميل الملف.\nقد يكون الفيديو محمياً أو غير متاح.', event.threadID);
    }
  }

  async downloadYouTube(url, api, event, videoInfo) {
    try {
      // استخدام API محسّنة لتحميل الفيديو
      const downloadUrl = `https://api.cobalt.tools/api/json`;
      
      const response = await axios.post(downloadUrl, {
        url: url,
        vQuality: "360",
        aFormat: "mp3",
        videoFormat: "mp4"
      }, { timeout: 30000 });

      if (!response.data || !response.data.url) {
        // محاولة بديلة
        return api.sendMessage(`🎥 رابط الفيديو:\n${url}\n\n⚠️ | لا يمكن تحميل الفيديو تلقائياً.\nانقر على الرابط أعلاه لفتحه في YouTube.`, event.threadID);
      }

      const directLink = response.data.url;

      const tempPath = path.join(process.cwd(), "cache", `yt_video_${event.senderID}_${Date.now()}.mp4`);
      const writer = fs.createWriteStream(tempPath);

      const res = await axios({ url: directLink, responseType: "stream", timeout: 60000 });
      res.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
      });

      // التحقق من حجم الملف
      const fileStats = fs.statSync(tempPath);
      if (fileStats.size > 26214400) { // 25MB
        fs.unlinkSync(tempPath);
        return api.sendMessage('❌ | لا يمكن إرسال الملف لأن حجمه أكبر من 25 ميغابايت.', event.threadID);
      }

      const message = {
        body: `━━━━━━━◈✿◈━━━━━━━\n✅ | تـم تـحـمـيـل الـفـيـديو:\n❀ الـعـنـوان : ${videoInfo.title}\n📺 الـقـنـاة : ${videoInfo.author.name}\n━━━━━━━◈✿◈━━━━━━━`,
        attachment: fs.createReadStream(tempPath)
      };

      await api.sendMessage(message, event.threadID);
      
      // حذف الملف المؤقت
      setTimeout(() => {
        try {
          fs.unlinkSync(tempPath);
        } catch (e) {}
      }, 5000);

    } catch (error) {
      console.error('[ERROR] في تحميل الفيديو:', error.message);
      api.sendMessage(`🎥 رابط الفيديو:\n${videoInfo.url}\n\n⚠️ | لا يمكن تحميل الفيديو تلقائياً.\nانقر على الرابط أعلاه لفتحه في YouTube.`, event.threadID);
    }
  }
}

export default new YouTube();
