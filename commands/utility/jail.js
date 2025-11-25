import fs from 'fs';
import path from 'path';
import axios from 'axios';

class Jail {
  constructor() {
    this.name = "سجن";
    this.author = "Yamada KJ & Alastor";
    this.role = 0;
    this.description = "تحويل صورة الملف الشخصي إلى صورة مسجون";
    this.cooldowns = 10;
    this.aliases = ["سجن", "jail"];
  }

  async execute({ api, event, args }) {
    const { threadID, messageID, senderID } = event;
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
      api.setMessageReaction("⏳", messageID, () => {}, true);

      // Get the profile picture URL for the specified user ID
      const profilePicUrl = `https://api-turtle.vercel.app/api/facebook/pfp?uid=${id}`;

      // Call the jail API to get the "jailed" image
      const response = await axios.get(`https://api.popcat.xyz/jail?image=${encodeURIComponent(profilePicUrl)}`, { 
        responseType: 'stream',
        timeout: 30000
      });

      const cacheDir = path.join(process.cwd(), 'cache');
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

      const tempFilePath = path.join(cacheDir, `${Date.now()}_jail.png`);
      const writer = fs.createWriteStream(tempFilePath);
      response.data.pipe(writer);

      writer.on('finish', async () => {
        const attachment = fs.createReadStream(tempFilePath);
        await api.sendMessage({ 
          body: "       مسجون 🚔       ", 
          attachment: attachment 
        }, threadID, (err, info) => {
          fs.unlinkSync(tempFilePath);
        }, messageID);

        api.setMessageReaction("✅", messageID, () => {}, true);
      });

      writer.on('error', (err) => {
        console.error(err);
        api.setMessageReaction("❌", messageID, () => {}, true);
        api.sendMessage("❌ | حدث خطأ أثناء معالجة الصورة.", threadID);
      });
    } catch (error) {
      console.error(error);
      api.setMessageReaction("❌", messageID, () => {}, true);
      api.sendMessage("❌ | حدث خطأ أثناء استدعاء API.", threadID);
    }
  }
}

export default new Jail();
