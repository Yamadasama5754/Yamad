import fs from "fs-extra";
import jimp from "jimp";
import path from "path";
import axios from "axios";

class ProposeCommand {
  constructor() {
    this.name = "طلب";
    this.author = "Yamada KJ & Alastor";
    this.role = 0;
    this.description = "التقدم من اجل خطبة فتاة في جو درامي.";
    this.cooldowns = 20;
    this.aliases = ["طلب"];
    this.fbToken = "6628568379%7Cc1e620fa708a1d5696fb991c1bde5662";
  }

  async getUserGender(userId) {
    try {
      const response = await axios.get(`https://graph.facebook.com/${userId}`, {
        params: {
          fields: "gender",
          access_token: this.fbToken
        },
        timeout: 5000
      });
      return response.data.gender || "unknown";
    } catch (error) {
      console.warn(`تحذير: لم يتمكن من جلب النوع للمستخدم ${userId}`, error.message);
      return "unknown";
    }
  }

  async createProposalImage(female, male) {
    try {
      let avfemale = await jimp.read(`https://graph.facebook.com/${female}/picture?width=512&height=512&access_token=${this.fbToken}`);
      avfemale.circle();
      
      let avmale = await jimp.read(`https://graph.facebook.com/${male}/picture?width=512&height=512&access_token=${this.fbToken}`);
      avmale.circle();
      
      let img = await jimp.read("https://i.ibb.co/RNBjSJk/image.jpg");
      // الأنثى على اليسار (210, 65)
      // الذكر على اليمين (458, 105)
      img.resize(760, 506).composite(avfemale.resize(90, 90), 210, 65).composite(avmale.resize(90, 90), 458, 105);

      const outputPath = path.join(process.cwd(), "temp", `propose_${Date.now()}.png`);
      if (!fs.existsSync(path.dirname(outputPath))) {
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
      }

      await img.writeAsync(outputPath);
      return outputPath;
    } catch (error) {
      throw new Error(`فشل إنشاء صورة الطلب: ${error.message}`);
    }
  }

  async execute({ api, event, args }) {
    const mention = Object.keys(event.mentions);
    
    if (mention.length === 0) {
      api.sendMessage("🔖 | منشن 😀", event.threadID, event.messageID);
      return;
    }

    const sentMsg = await api.sendMessage("⏱️ | جاري إنشاء صورة الطلب....", event.threadID);

    try {
      let user1, user2;
      
      if (mention.length === 1) {
        user1 = event.senderID;
        user2 = mention[0];
      } else {
        user1 = mention[0];
        user2 = mention[1];
      }

      // جلب نوع كل مستخدم
      const gender1 = await this.getUserGender(user1);
      const gender2 = await this.getUserGender(user2);

      // ترتيب بحيث تكون الأنثى أولاً والذكر ثانياً
      let female, male;
      
      if (gender1 === "female" || (gender1 !== "male" && gender2 === "male")) {
        female = user1;
        male = user2;
      } else {
        female = user2;
        male = user1;
      }

      const imagePath = await this.createProposalImage(female, male);
      
      await api.sendMessage({
        body: "「 أرجوكي كوني من نصيبي 🤩 」",
        attachment: fs.createReadStream(imagePath)
      }, event.threadID, () => {
        if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
      });

      api.unsendMessage(sentMsg.messageID);
    } catch (error) {
      console.error("خطأ في أمر الطلب:", error);
      api.sendMessage("❌ | حدث خطأ أثناء إنشاء الصورة", event.threadID, event.messageID);
      api.unsendMessage(sentMsg.messageID);
    }
  }

  async onReply({ api, event, reply }) {
    const targetUserId = event.messageReply.senderID;
    const senderUserId = event.senderID;
    
    const sentMsg = await api.sendMessage("⏱️ | جاري إنشاء صورة الطلب....", event.threadID);

    try {
      // جلب نوع كل مستخدم
      const genderTarget = await this.getUserGender(targetUserId);
      const genderSender = await this.getUserGender(senderUserId);

      // ترتيب بحيث تكون الأنثى أولاً والذكر ثانياً
      let female, male;
      
      if (genderTarget === "female" || (genderTarget !== "male" && genderSender === "male")) {
        female = targetUserId;
        male = senderUserId;
      } else {
        female = senderUserId;
        male = targetUserId;
      }

      const imagePath = await this.createProposalImage(female, male);
      
      await api.sendMessage({
        body: "「 أرجوكي كوني من نصيبي 🤩 」",
        attachment: fs.createReadStream(imagePath)
      }, event.threadID, () => {
        if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
      });

      api.unsendMessage(sentMsg.messageID);
    } catch (error) {
      console.error("خطأ في أمر الطلب:", error);
      api.sendMessage("❌ | حدث خطأ أثناء إنشاء الصورة", event.threadID, event.messageID);
      api.unsendMessage(sentMsg.messageID);
    }
  }
}

export default new ProposeCommand();
