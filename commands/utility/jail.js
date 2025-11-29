import fs from 'fs';
import path from 'path';
import axios from 'axios';
import jimp from 'jimp';

class Jail {
  constructor() {
    this.name = "سجن";
    this.author = "Yamada KJ & Alastor";
    this.role = 0;
    this.description = "تحويل صورة الملف الشخصي إلى صورة مسجون بجودة عالية";
    this.cooldowns = 10;
    this.aliases = ["سجن", "jail"];
  }

  async execute({ api, event, args, Economy }) {
    const { threadID, messageID, senderID } = event;
    const cost = 400;
    const userBalance = (await Economy.getBalance(senderID)).data;
    
    if (userBalance < cost) {
      return api.sendMessage(
        `⚠️ | تحتاج إلى ${cost} دولار في محفظتك للعب`,
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

    try {
      await Economy.decrease(cost, senderID);
      api.setMessageReaction("⏳", messageID, () => {}, true);

      // ✅ استخدام API بجودة أعلى
      const profilePicUrl = `https://api-turtle.vercel.app/api/facebook/pfp?uid=${id}`;

      // ✅ استخدام API بجودة أعلى من popcat
      const response = await axios.get(`https://api.popcat.xyz/jail?image=${encodeURIComponent(profilePicUrl)}`, { 
        responseType: 'arraybuffer',
        timeout: 30000
      });

      const cacheDir = path.join(process.cwd(), 'cache');
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

      const tempFilePath = path.join(cacheDir, `${Date.now()}_jail.png`);

      // ✅ معالجة الصورة بـ Jimp لتحسين الجودة
      try {
        let image = await jimp.read(Buffer.from(response.data));

        // تحسينات على الصورة:
        // 1. زيادة التشبع للألوان الأفضل
        image = image.color([
          { apply: 'saturate', params: [10] },
          { apply: 'brighten', params: [3] }
        ]);

        // 2. شحذ الصورة للوضوح الأفضل
        image = image.sharpen();

        // 3. حفظ بجودة عالية
        await image.write(tempFilePath);

        const attachment = fs.createReadStream(tempFilePath);
        await api.sendMessage({ 
          body: "       مسجون 🚔       ", 
          attachment: attachment 
        }, threadID, (err, info) => {
          setTimeout(() => {
            try {
              fs.unlinkSync(tempFilePath);
            } catch (e) {}
          }, 1000);
        }, messageID);

        api.setMessageReaction("✅", messageID, () => {}, true);

      } catch (jimpErr) {
        // إذا فشل Jimp، احفظ الصورة الأصلية مباشرة
        console.warn("Jimp processing failed, sending original image:", jimpErr.message);
        await fs.writeFileSync(tempFilePath, Buffer.from(response.data));

        const attachment = fs.createReadStream(tempFilePath);
        await api.sendMessage({ 
          body: "       مسجون 🚔       ", 
          attachment: attachment 
        }, threadID, (err, info) => {
          setTimeout(() => {
            try {
              fs.unlinkSync(tempFilePath);
            } catch (e) {}
          }, 1000);
        }, messageID);

        api.setMessageReaction("✅", messageID, () => {}, true);
      }

    } catch (error) {
      console.error(error);
      api.setMessageReaction("❌", messageID, () => {}, true);
      api.sendMessage("❌ | حدث خطأ أثناء معالجة الصورة.", threadID);
    }
  }
}

export default new Jail();
