import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';

class YouTube {
  constructor() {
    this.name = "يوتيوب";
    this.author = "حسين يعقوبي";
    this.cooldowns = 60;
    this.description = "تنزيل مقطع من YouTube";
    this.role = 0;
    this.aliases = ["يوتيب", "فيديو", "مقطع"];
  }

  async execute({ api, event }) {
    const input = event.body;
    const data = input.split(" ");

    if (data.length < 2) {
      return api.sendMessage("⚠️ | أرجوك قم بإدخال اسم المقطع.", event.threadID);
    }

    data.shift();
    const videoName = data.join(" ");

    try {
      const sentMessage = await api.sendMessage(`✔ | جاري البحث عن المقطع المطلوب "${videoName}". المرجو الانتظار...`, event.threadID);

      const searchUrl = `https://c-v1.onrender.com/yt/s?query=${encodeURIComponent(videoName)}`;
      const searchResponse = await axios.get(searchUrl, { timeout: 15000 });

      const searchResults = searchResponse.data;
      if (!searchResults || searchResults.length === 0) {
        api.unsendMessage(sentMessage.messageID);
        return api.sendMessage("⚠️ | لم يتم العثور على أي نتائج.", event.threadID);
      }

      let msg = '🎥 | تم العثور على المقاطع التالية:\n\n';
      const selectedResults = searchResults.slice(0, 4);
      const attachments = [];

      const numberSymbols = ['⓵', '⓶', '⓷', '⓸'];

      for (let i = 0; i < selectedResults.length; i++) {
        const video = selectedResults[i];
        const videoIndex = numberSymbols[i];

        msg += `${videoIndex} ❀ العنوان: ${video.title}\n`;

        // تنزيل الصورة وإضافتها إلى المرفقات
        try {
          const imagePath = path.join(process.cwd(), 'cache', `video_thumb_${i + 1}.jpg`);
          
          // تأكد من وجود مجلد cache
          await fs.ensureDir(path.join(process.cwd(), 'cache'));
          
          const imageStream = await axios({
            url: video.thumbnail,
            responseType: 'stream',
            timeout: 10000
          });

          const writer = fs.createWriteStream(imagePath);
          imageStream.data.pipe(writer);

          await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
          });

          attachments.push(fs.createReadStream(imagePath));
        } catch (imgErr) {
          console.warn(`تحذير: فشل تحميل الصورة ${i + 1}:`, imgErr.message);
        }
      }

      msg += '\n📥 | الرجاء الرد برقم المقطع الذي تود تنزيله.';

      api.unsendMessage(sentMessage.messageID);

      api.sendMessage({ body: msg, attachment: attachments }, event.threadID, (error, info) => {
        if (error) return console.error(error);

        global.client.handler.reply.set(info.messageID, {
          author: event.senderID,
          type: "pick",
          name: "يوتيوب",
          searchResults: selectedResults,
          unsend: true
        });

        // حذف الصور المؤقتة بعد إرسال الرسالة
        attachments.forEach((file) => {
          try {
            fs.unlinkSync(file.path);
          } catch (e) {}
        });
      });

    } catch (error) {
      console.error('[ERROR]', error.message);
      api.sendMessage('🥱 ❀ حدث خطأ أثناء معالجة الأمر.', event.threadID);
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
    const videoUrl = video.videoUrl;

    try {
      api.setMessageReaction("⬇️", event.messageID, (err) => {}, true);

      const downloadUrl = `https://c-v1.onrender.com/downloader?url=${encodeURIComponent(videoUrl)}`;
      const downloadResponse = await axios.get(downloadUrl, { timeout: 30000 });

      const videoFileUrl = downloadResponse.data.media.url;
      if (!videoFileUrl) {
        api.setMessageReaction("❌", event.messageID, (err) => {}, true);
        return api.sendMessage("⚠️ | لم يتم العثور على رابط تحميل المقطع.", event.threadID);
      }

      const fileName = `${event.senderID}_${Date.now()}.mp4`;
      const filePath = path.join(process.cwd(), 'cache', fileName);

      // تأكد من وجود مجلد cache
      await fs.ensureDir(path.join(process.cwd(), 'cache'));

      const writer = fs.createWriteStream(filePath);
      
      const videoStream = await axios.get(videoFileUrl, { 
        responseType: 'stream',
        timeout: 60000 
      });
      
      videoStream.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      const fileStats = fs.statSync(filePath);
      if (fileStats.size > 26214400) {
        fs.unlinkSync(filePath);
        api.setMessageReaction("❌", event.messageID, (err) => {}, true);
        return api.sendMessage('❌ | لا يمكن إرسال الملف لأن حجمه أكبر من 25 ميغابايت.', event.threadID);
      }

      api.setMessageReaction("✅", event.messageID, (err) => {}, true);

      const message = {
        body: `━━━━━━━◈✿◈━━━━━━━\n✅ | تـم تـحـمـيـل الـفـيـديو:\n❀ الـعـنـوان : ${video.title}\n━━━━━━━◈✿◈━━━━━━━`,
        attachment: fs.createReadStream(filePath)
      };

      api.sendMessage(message, event.threadID, () => {
        try {
          fs.unlinkSync(filePath);
        } catch (e) {}
      });

    } catch (error) {
      console.error('[ERROR]', error.message);
      api.setMessageReaction("❌", event.messageID, (err) => {}, true);
      api.sendMessage('🥱 ❀ حدث خطأ أثناء معالجة الأمر.', event.threadID);
    }
  }
}

export default new YouTube();
