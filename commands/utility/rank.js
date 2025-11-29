import fs from "fs-extra";
import path from "path";
import jimp from "jimp";
import axios from "axios";
import { createCanvas, registerFont, loadImage } from "canvas";

class RankCommand {
  constructor() {
    this.name = "مستواي";
    this.author = "CataliCS";
    this.cooldowns = 20;
    this.description = "عرض كارت مستواك";
    this.role = 0;
    this.aliases = ["رانك", "rank"];
    this.APIKEY = "571752207151901|AC-zG86sv6U6kpnT0_snIHBOHJc";
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
      let rankCardUrl = "https://i.imgur.com/neYz0Wy.png";
      const rankCardResponse = await axios.get(rankCardUrl, { responseType: "arraybuffer" });
      const rankCardBuffer = rankCardResponse.data;
      
      let rankCard = await loadImage(rankCardBuffer);

      var expWidth = (expCurrent * 615) / expNextLevel;
      if (expWidth > 615 - 18.5) expWidth = 615 - 18.5;

      let avatarUrl = `https://graph.facebook.com/${id}/picture?width=512&height=512&access_token=${this.APIKEY}`;
      let avatarResponse = await axios.get(avatarUrl, { responseType: "arraybuffer" });
      let avatar = await this.circleImage(avatarResponse.data);

      const canvas = createCanvas(934, 282);
      const ctx = canvas.getContext("2d");

      ctx.drawImage(rankCard, 0, 0, canvas.width, canvas.height);
      ctx.drawImage(await loadImage(avatar), 45, 50, 180, 180);

      ctx.font = `bold 36px Arial`;
      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "start";
      ctx.fillText(name, 270, 164);

      ctx.font = `bold 32px Arial`;
      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "end";
      ctx.fillText(level, 934 - 55, 82);
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText("Lv.", 934 - 55 - ctx.measureText(level).width - 10, 82);

      ctx.font = `bold 32px Arial`;
      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "end";
      ctx.fillText(rank, 934 - 55 - ctx.measureText(level).width - 16 - ctx.measureText(`Lv.`).width - 25, 82);
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText("#", 934 - 55 - ctx.measureText(level).width - 16 - ctx.measureText(`Lv.`).width - 16 - ctx.measureText(rank).width - 16, 82);

      ctx.font = `bold 26px Arial`;
      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "start";
      ctx.fillText("/ " + expNextLevel, 710 + ctx.measureText(expCurrent).width + 10, 164);
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText(expCurrent, 710, 164);

      ctx.beginPath();
      ctx.fillStyle = "#4283FF";
      ctx.arc(257 + 18.5, 147.5 + 18.5 + 36.25, 18.5, 1.5 * PI, 0.5 * PI, true);
      ctx.fill();
      ctx.fillRect(257 + 18.5, 147.5 + 36.25, expWidth, 37.5);
      ctx.arc(257 + 18.5 + expWidth, 147.5 + 18.5 + 36.25, 18.75, 1.5 * PI, 0.5 * PI, false);
      ctx.fill();

      const imageBuffer = canvas.toBuffer();
      fs.writeFileSync(pathImg, imageBuffer);
      return pathImg;
    } catch (error) {
      console.error("Error making rank card:", error);
      throw error;
    }
  }

  async circleImage(imageBuffer) {
    try {
      let image = await jimp.read(imageBuffer);
      image.circle();
      return await image.getBuffer("image/png");
    } catch (error) {
      console.error("Error creating circle image:", error);
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

      dataAll.sort(function (a, b) { return b.exp - a.exp; });

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
        console.warn("Could not get user name");
      }

      const point = await this.getInfo(event.senderID, Currencies);
      const timeStart = Date.now();

      let pathRankCard = await this.makeRankCard({ id: event.senderID, name: userName, rank, ...point });

      api.setMessageReaction("✅", event.messageID, (err) => {}, true);
      return api.sendMessage(
        {
          body: `✅ تم إنشاء الكارت في ${Date.now() - timeStart}ms`,
          attachment: fs.createReadStream(pathRankCard, { highWaterMark: 128 * 1024 })
        },
        event.threadID,
        () => {
          if (fs.existsSync(pathRankCard)) fs.unlinkSync(pathRankCard);
        },
        event.messageID
      );

    } catch (error) {
      console.error("[RANK] Error:", error);
      api.setMessageReaction("❌", event.messageID, (err) => {}, true);
      api.sendMessage("❌ حدث خطأ في الأمر: " + error.message, event.threadID, event.messageID);
    }
  }
}

export default new RankCommand();
