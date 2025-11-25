import fs from "fs-extra";
import jimp from "jimp";
import path from "path";

class GraveCommand {
  constructor() {
    this.name = "قبر";
    this.author = "Yamada KJ & Alastor";
    this.role = 0;
    this.description = "صورة على قبر";
    this.cooldowns = 25;
    this.aliases = ["قبر"];
    this.fbToken = "6628568379%7Cc1e620fa708a1d5696fb991c1bde5662";
  }

  async execute({ api, event }) {
    const mention = Object.keys(event.mentions);
    let targetUserId;

    if (mention.length === 0) {
      targetUserId = event.senderID;
    } else {
      targetUserId = mention[0];
    }

    const sentMsg = await api.sendMessage("⏱️ | جاري إنشاء صورة القبر....", event.threadID);

    try {
      const imagePath = await this.createGraveImage(targetUserId);
      await api.sendMessage({
        body: "كان إنساناً طيباً 🤧",
        attachment: fs.createReadStream(imagePath)
      }, event.threadID, () => {
        if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
      });
      api.unsendMessage(sentMsg.messageID);
    } catch (error) {
      console.error("خطأ في أمر القبر:", error);
      api.sendMessage("❌ | حدث خطأ أثناء إنشاء الصورة", event.threadID, event.messageID);
      api.unsendMessage(sentMsg.messageID);
    }
  }

  async onReply({ api, event, reply }) {
    const targetUserId = event.messageReply.senderID;
    const sentMsg = await api.sendMessage("⏱️ | جاري إنشاء صورة القبر....", event.threadID);

    try {
      const imagePath = await this.createGraveImage(targetUserId);
      await api.sendMessage({
        body: "كان إنساناً طيباً 🤧",
        attachment: fs.createReadStream(imagePath)
      }, event.threadID, () => {
        if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
      });
      api.unsendMessage(sentMsg.messageID);
    } catch (error) {
      console.error("خطأ في أمر القبر:", error);
      api.sendMessage("❌ | حدث خطأ أثناء إنشاء الصورة", event.threadID, event.messageID);
      api.unsendMessage(sentMsg.messageID);
    }
  }

  async createGraveImage(userId) {
    try {
      const avatarUrl = `https://graph.facebook.com/${userId}/picture?type=large&access_token=${this.fbToken}`;
      const graveTemplateUrl = "https://i.imgur.com/A4quyh3.jpg";

      let avatar = await jimp.read(avatarUrl);
      const graveImage = await jimp.read(graveTemplateUrl);

      // تحسين جودة الصورة والأبعاد
      avatar = avatar.resize(180, 180);
      graveImage.resize(500, 670);

      // وضع البروفايل في المركز
      const avatarX = Math.round((500 - 180) / 2); // مركز أفقي
      const avatarY = 110; // موقع عمودي

      graveImage.composite(avatar, avatarX, avatarY);

      const outputPath = path.join(process.cwd(), "temp", `grave_${Date.now()}.jpg`);
      
      if (!fs.existsSync(path.dirname(outputPath))) {
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
      }

      await graveImage.writeAsync(outputPath);
      return outputPath;
    } catch (error) {
      throw new Error(`فشل إنشاء صورة القبر: ${error.message}`);
    }
  }
}

export default new GraveCommand();
