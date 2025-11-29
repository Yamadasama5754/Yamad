import fs from 'fs';
import path from 'path';
import axios from 'axios';

export default {
  name: "ضباب",
  author: "KAGUYA PROJECT",
  role: "member",
  description: "تحويل صورة الملف الشخصي إلى صورة ضبابية.",

  execute: async ({ api, event, args, Economy }) => {
    const { threadID, messageID, senderID } = event;
    const cost = 250;

    try {
      // التحقق من الرصيد
      const userBalance = (await Economy.getBalance(senderID)).data;
      if (userBalance < cost) {
        return api.sendMessage(
          `⚠️ | تحتاج إلى ${cost} دولار في محفظتك. رصيدك الحالي: ${userBalance}`,
          threadID
        );
      }

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

      // Get the profile picture URL for the specified user ID
      const profilePicUrl = `https://api-turtle.vercel.app/api/facebook/pfp?uid=${id}`;

      // Call the blur API to get the blurred image
      const response = await axios.get(`https://api.popcat.xyz/blur?image=${encodeURIComponent(profilePicUrl)}`, { responseType: 'stream', timeout: 10000 });

      const cacheDir = path.join(process.cwd(), 'cache');
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }

      const tempFilePath = path.join(cacheDir, `blur_${Date.now()}.png`);
      const writer = fs.createWriteStream(tempFilePath);
      response.data.pipe(writer);

      writer.on('finish', async () => {
        await Economy.decrease(cost, senderID);
        const attachment = fs.createReadStream(tempFilePath);
        api.sendMessage({ body: "ضبابية 🌫️ (تم خصم 250 دولار)", attachment: attachment }, threadID, () => {
          if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
        }, messageID);
        api.setMessageReaction("✅", event.messageID, (err) => {}, true);
      });

      writer.on('error', (err) => {
        console.error(err);
        api.setMessageReaction("❌", event.messageID, (err) => {}, true);
        api.sendMessage("حدث خطأ أثناء معالجة الصورة.", threadID, messageID);
      });
    } catch (error) {
      console.error(error);
      api.setMessageReaction("❌", event.messageID, (err) => {}, true);
      api.sendMessage("❌ | حدث خطأ: " + error.message, threadID, messageID);
    }
  }
};
