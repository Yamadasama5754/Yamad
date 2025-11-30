import fs from 'fs';
import path from 'path';
import axios from 'axios';

export default {
  name: "حيواني",
  author: "Your Name",
  role: "member",
  description: "تحويل صورة الملف الشخصي إلى حيوان أليف.",
  execute: async ({ api, event, args, message }) => {
    const { threadID, messageID, senderID, body } = event;
    let id;

    // التحقق من وجود إشارة إلى مستخدم في الرسالة
    if (args.join().indexOf('@') !== -1) {
      id = Object.keys(event.mentions);
    } else {
      id = args[0] || senderID;
    }

    // إذا كانت الرسالة رد على رسالة أخرى، استخدم معرف المرسل الأصلي
    if (event.type === "message_reply") {
      id = event.messageReply.senderID;
    }

    try {
      // استدعاء API للحصول على صورة الحيوان الأليف
      const response = await axios.get(`https://api.popcat.xyz/pet?image=https://api-turtle.vercel.app/api/facebook/pfp?uid=${id}`, { responseType: 'stream' });

      const tempFilePath = path.join(process.cwd(), 'temp.png');
      const writer = fs.createWriteStream(tempFilePath);
      response.data.pipe(writer);

      writer.on('finish', async () => {
        const attachment = fs.createReadStream(tempFilePath);
        await api.sendMessage({ body: "حيواني الأليف", attachment: attachment }, threadID, messageID);

        // إزالة الملف المؤقت بعد إرساله
        fs.unlinkSync(tempFilePath);
      });

      writer.on('error', (err) => {
        console.error(err);
        api.sendMessage("حدث خطأ أثناء معالجة الصورة.", threadID, messageID);
      });
    } catch (error) {
      console.error(error);
      api.sendMessage("حدث خطأ أثناء استدعاء API.", threadID, messageID);
    }
  }
};
