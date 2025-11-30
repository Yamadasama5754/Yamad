import fs from "fs-extra";
import path from "path";
import jimp from "jimp";
import axios from "axios";
import { createCanvas, registerFont, loadImage } from "canvas";

class RankCommand {
  constructor() {
    this.name = "لفل";
    this.author = "عمر & محسّن";
    this.cooldowns = 20;
    this.description = "عرض كارت الرتبة والمستوى بتصميم احترافي";
    this.role = 0;
    this.aliases = ["مستوى", "level", "rank", "رانك"];
    this.APIKEY = "571752207151901|AC-zG86sv6U6kpnT0_snIHBOHJc";
    this.rankCardUrls = [
      "https://i.postimg.cc/2SX994dy/370302233-350278991004060-783576214704582311-n.jpg",
      "https://i.postimg.cc/2SX994dy/370302233-350278991004060-783576214704582311-n.jpg",
      "https://i.postimg.cc/2SX994dy/370302233-350278991004060-783576214704582311-n.jpg"
    ];
  }

  async downloadImage(url, retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await axios.get(url, {
          responseType: "arraybuffer",
          timeout: 10000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        if (response.data && response.data.length > 0) {
          return Buffer.from(response.data, "binary");
        }
      } catch (error) {
        console.error(`[RANK] محاولة ${i + 1} فشلت لتحميل الصورة:`, error.message);
        
        if (i < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    
    throw new Error(`فشل تحميل الصورة بعد ${retries} محاولات`);
  }

  async makeRankCard(data) {
    const { id, name, rank, level, expCurrent, expNextLevel } = data;
    const PI = Math.PI;

    const cacheDir = path.join(process.cwd(), "cache");
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }

    const pathImg = path.join(cacheDir, `rank_${id}.png`);

    try {
      // اختر rankcard عشوائي
      const randomIndex = Math.floor(Math.random() * this.rankCardUrls.length);
      const rankCardUrl = this.rankCardUrls[randomIndex];
      
      let rankCardBuffer;
      try {
        rankCardBuffer = await this.downloadImage(rankCardUrl);
      } catch (err) {
        console.warn("[RANK] فشل تحميل rankcard، استخدام fallback");
        rankCardBuffer = await this.downloadImage(this.rankCardUrls[0]);
      }
      
      let rankCard = await loadImage(rankCardBuffer);

      let expWidth = (expCurrent * 615) / expNextLevel;
      if (expWidth > 615 - 18.5) expWidth = 615 - 18.5;

      // تحميل الأفاتار من Facebook
      let avatarUrl = `https://graph.facebook.com/${id}/picture?width=512&height=512&access_token=${this.APIKEY}`;
      let avatarBuffer = await this.downloadImage(avatarUrl);
      let avatar = await this.circleImage(avatarBuffer);

      const canvas = createCanvas(934, 282);
      const ctx = canvas.getContext("2d");

      ctx.drawImage(rankCard, 0, 0, canvas.width, canvas.height);
      ctx.drawImage(await loadImage(avatar), 45, 50, 180, 180);

      ctx.font = `bold 38px Arial`;
      ctx.fillStyle = `#111111`;
      ctx.textAlign = "start";
      ctx.fillText(name, 270, 111);

      ctx.font = `bold 37px Arial`;
      ctx.fillStyle = `#111111`;
      ctx.textAlign = "end";
      ctx.fillText(level, 870 - 55, 80);
      ctx.fillStyle = `#111111`;
      ctx.fillText("Lv.", 934 - 55 - ctx.measureText(level).width - 67, 80);

      ctx.font = `bold 37px Arial`;
      ctx.fillStyle = `#111111`;
      ctx.textAlign = "end";
      ctx.fillText(rank, 934 - 55 - ctx.measureText(level).width - 88 - ctx.measureText(`Lv.`).width + 190, 120);
      ctx.fillStyle = `#111111`;
      ctx.fillText("#", 904 - 55 - ctx.measureText(level).width - 19 - ctx.measureText(`Lv.`).width - 19 - ctx.measureText(rank).width + 170, 120);

      ctx.font = `bold 29px Arial`;
      ctx.fillStyle = `#111111`;
      ctx.textAlign = "start";
      ctx.fillText("/ " + expNextLevel, 710 + ctx.measureText(expCurrent).width + 104, 227);
      ctx.fillStyle = `#111111`;
      ctx.fillText(expCurrent, 800, 227);

      ctx.beginPath();
      ctx.fillStyle = `#4283FF`;
      ctx.arc(257 + 18.5, 147.5 + 18.5 + 36.25, 18.5, 1.5 * PI, 0.5 * PI, true);
      ctx.fill();
      ctx.fillRect(257 + 18.5, 147.5 + 36.25, expWidth, 37.5);
      ctx.arc(257 + 18.5 + expWidth, 147.5 + 18.5 + 36.25, 18.75, 1.5 * PI, 0.5 * PI, false);
      ctx.fill();

      const imageBuffer = canvas.toBuffer();
      fs.writeFileSync(pathImg, imageBuffer);
      return pathImg;
    } catch (error) {
      console.error("[RANK] خطأ في إنشاء كارت الرتبة:", error);
      throw error;
    }
  }

  async circleImage(imageBuffer) {
    try {
      let image = await jimp.read(imageBuffer);
      image.circle();
      return await image.getBuffer("image/png");
    } catch (error) {
      console.error("[RANK] خطأ في إنشاء الصورة الدائرية:", error);
      throw error;
    }
  }

  expToLevel(point) {
    if (point < 0) return 0;
    return Math.floor((Math.sqrt(1 + (4 * point) / 3) + 1) / 2);
  }

  levelToExp(level) {
    if (level <= 0) return 0;
    return 3 * level * (level - 1);
  }

  async getInfo(uid, Currencies) {
    try {
      let userData = await Currencies.getData(uid);
      let point = userData?.exp || 0;
      const level = this.expToLevel(point);
      const expCurrent = point - this.levelToExp(level);
      const expNextLevel = this.levelToExp(level + 1) - this.levelToExp(level);
      return { level, expCurrent, expNextLevel };
    } catch (e) {
      return { level: 1, expCurrent: 0, expNextLevel: 100 };
    }
  }

  async execute({ api, event, Currencies, Users }) {
    try {
      api.setMessageReaction("⏳", event.messageID, (err) => {}, true);

      if (!Currencies || typeof Currencies.getAll !== 'function') {
        api.setMessageReaction("❌", event.messageID, (err) => {}, true);
        return api.sendMessage("❌ | نظام الترتيب غير متاح حالياً", event.threadID, event.messageID);
      }

      let dataAll = await Currencies.getAll(["userID", "exp"]);
      if (!dataAll || !Array.isArray(dataAll)) {
        api.setMessageReaction("❌", event.messageID, (err) => {}, true);
        return api.sendMessage("❌ | خطأ في جلب البيانات", event.threadID, event.messageID);
      }

      dataAll.sort((a, b) => b.exp - a.exp);

      const rank = dataAll.findIndex(item => parseInt(item.userID) == parseInt(event.senderID)) + 1;
      
      if (rank == 0) {
        api.setMessageReaction("❌", event.messageID, (err) => {}, true);
        return api.sendMessage("❌ | لست في قاعدة البيانات بعد اعد المحاولة في وقت لاحق", event.threadID, event.messageID);
      }

      let userName = "Unknown";
      try {
        const userInfo = await api.getUserInfo(event.senderID);
        userName = userInfo[event.senderID]?.name || "Unknown";
      } catch (e) {
        console.warn("[RANK] تعذر الحصول على اسم المستخدم");
      }

      const point = await this.getInfo(event.senderID, Currencies);
      const timeStart = Date.now();

      let pathRankCard = await this.makeRankCard({ id: event.senderID, name: userName, rank, ...point });

      api.setMessageReaction("✅", event.messageID, (err) => {}, true);
      return api.sendMessage(
        {
          body: `👑 اسمك: ${userName}\n🏆 ترتيبك: #${rank}\n⏱️ تم الإنشاء في ${Date.now() - timeStart}ms`,
          attachment: fs.createReadStream(pathRankCard, { highWaterMark: 128 * 1024 })
        },
        event.threadID,
        () => {
          if (fs.existsSync(pathRankCard)) fs.unlinkSync(pathRankCard);
        },
        event.messageID
      );

    } catch (error) {
      console.error("[RANK] خطأ:", error);
      api.setMessageReaction("❌", event.messageID, (err) => {}, true);
      api.sendMessage("❌ حدث خطأ في الأمر: " + error.message, event.threadID, event.messageID);
    }
  }
}

export default new RankCommand();
