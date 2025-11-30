import fs from 'fs';
import path from 'path';
import axios from 'axios';

export default {
  name: "ضباب",
  author: "KAGUYA PROJECT",
  role: "member",
  description: "تحويل صورة الملف الشخصي إلى صورة ضبابية - يمكن الرد على شخص أو كتابة معرفه",

  execute: async ({ api, event, args }) => {
    const { threadID, messageID, senderID } = event;

    try {
      let id;
      // التحقق من وجود إشارة إلى مستخدم في الرسالة
      if (args.join().indexOf('@') !== -1) {
        id = Object.keys(event.mentions)[0];
      } else {
        id = args[0] || senderID;
      }

      // إذا كانت الرسالة رد على رسالة أخرى، استخدم معرف المرسل الأصلي
      if (event.type === "message_reply") {
        id = event.messageReply.senderID;
      }

      api.setMessageReaction("⏳", event.messageID, (err) => {}, true);

      await applyBlur(api, threadID, messageID, id);

    } catch (error) {
      console.error(error);
      api.setMessageReaction("❌", event.messageID, (err) => {}, true);
      api.sendMessage("❌ | حدث خطأ: " + error.message, threadID, messageID);
    }
  },

  onReply: async ({ api, event, Users, Threads }) => {
    try {
      const { threadID, messageID, senderID } = event;

      let targetID = null;
      
      // إذا كان رد على رسالة من شخص آخر
      if (event.messageReply && event.messageReply.senderID) {
        targetID = event.messageReply.senderID;
      } else {
        // أو اكتب معرف مباشر
        targetID = event.body.trim();
      }

      if (!targetID) {
        return api.sendMessage("⚠️ الرجاء الرد على رسالة شخص أو كتابة معرفه.", threadID);
      }

      api.setMessageReaction("⏳", event.messageID, (err) => {}, true);

      await applyBlur(api, threadID, messageID, targetID);

    } catch (error) {
      console.error(error);
      api.setMessageReaction("❌", event.messageID, (err) => {}, true);
      api.sendMessage("❌ حدث خطأ: " + error.message, event.threadID);
    }
  }
};

// دالة مساعدة لتطبيق الضبابية
async function applyBlur(api, threadID, messageID, id) {
  try {
    // Get the profile picture URL for the specified user ID
    const profilePicUrl = `https://api-turtle.vercel.app/api/facebook/pfp?uid=${id}`;

    // Call the blur API to get the blurred image
    const response = await axios.get(`https://api.popcat.xyz/blur?image=${encodeURIComponent(profilePicUrl)}`, { 
      responseType: 'stream', 
      timeout: 10000 
    });

    const cacheDir = path.join(process.cwd(), 'cache');
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }

    const tempFilePath = path.join(cacheDir, `blur_${Date.now()}.png`);
    const writer = fs.createWriteStream(tempFilePath);
    response.data.pipe(writer);

    writer.on('finish', async () => {
      const attachment = fs.createReadStream(tempFilePath);
      api.sendMessage({ body: "ضبابية 🌫️", attachment: attachment }, threadID, () => {
        if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
      }, messageID);
      api.setMessageReaction("✅", messageID, (err) => {}, true);
    });

    writer.on('error', (err) => {
      console.error(err);
      api.setMessageReaction("❌", messageID, (err) => {}, true);
      api.sendMessage("حدث خطأ أثناء معالجة الصورة.", threadID, messageID);
    });

  } catch (error) {
    throw error;
  }
}
