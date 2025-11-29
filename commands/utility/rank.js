import Canvas from "canvas";
import path from "path";
import fs from "fs-extra";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultFontName = "BeVietnamPro-SemiBold";

try {
  const boldFont = path.join(process.cwd(), "assets", "font", "BeVietnamPro-Bold.ttf");
  const semiFont = path.join(process.cwd(), "assets", "font", "BeVietnamPro-SemiBold.ttf");

  if (fs.existsSync(boldFont)) {
    Canvas.registerFont(boldFont, { family: "BeVietnamPro-Bold" });
  }
  if (fs.existsSync(semiFont)) {
    Canvas.registerFont(semiFont, { family: defaultFontName });
  }
} catch (err) {
  console.warn("[RANK] Warning: Could not load fonts");
}

let deltaNext = 5;
const expToLevel = (exp, deltaNextLevel = deltaNext) => Math.floor((1 + Math.sqrt(1 + 8 * exp / deltaNextLevel)) / 2);
const levelToExp = (level, deltaNextLevel = deltaNext) => Math.floor(((Math.pow(level, 2) - level) * deltaNextLevel) / 2);
const percentage = total => total / 100;

function randomString(length) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

const defaultDesignCard = {
  widthCard: 2000,
  heightCard: 500,
  main_color: "#474747",
  sub_color: "rgba(255, 255, 255, 0.5)",
  alpha_subcard: 0.9,
  exp_color: "#e1e1e1",
  expNextLevel_color: "#3f3f3f",
  text_color: "#000000"
};

async function makeRankCard(userID, usersData, threadsData, threadID, deltaNext, api) {
  try {
    const userData = await usersData.get(userID);
    const { exp = 0 } = userData;
    const levelUser = expToLevel(exp, deltaNext);

    const expNextLevel = levelToExp(levelUser + 1, deltaNext) - levelToExp(levelUser, deltaNext);
    const currentExp = expNextLevel - (levelToExp(levelUser + 1, deltaNext) - exp);

    const allUser = await usersData.getAll();
    allUser.sort((a, b) => b.exp - a.exp);
    const rank = allUser.findIndex(user => user.userID == userID) + 1;

    const customRankCard = await threadsData.get(threadID, "data.customRankCard").catch(() => ({})) || {};
    
    let userName = "Unknown";
    try {
      const userInfo = await api.getUserInfo(userID);
      userName = userInfo[userID]?.name || "Unknown";
    } catch (e) {
      console.warn("[RANK] Could not get user info");
    }

    let avatar = null;
    try {
      avatar = `https://graph.facebook.com/${userID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
    } catch (e) {
      console.warn("[RANK] Could not load avatar");
    }

    const dataLevel = {
      exp: Math.max(0, currentExp),
      expNextLevel,
      name: userName,
      rank: `#${rank}/${allUser.length}`,
      level: levelUser,
      avatar: avatar
    };

    const configRankCard = {
      ...defaultDesignCard,
      ...customRankCard
    };

    const image = new RankCard({
      ...configRankCard,
      ...dataLevel
    });
    
    return await image.buildCard();
  } catch (err) {
    console.error("[RANK] Error making card:", err.message);
    throw err;
  }
}

class RankCard {
  constructor(options) {
    this.widthCard = 2000;
    this.heightCard = 500;
    this.main_color = "#474747";
    this.sub_color = "rgba(255, 255, 255, 0.5)";
    this.alpha_subcard = 0.9;
    this.exp_color = "#e1e1e1";
    this.expNextLevel_color = "#3f3f3f";
    this.text_color = "#000000";
    this.fontName = "BeVietnamPro-Bold";
    this.textSize = 0;

    for (const key in options)
      this[key] = options[key];
  }

  async buildCard() {
    let { widthCard, heightCard } = this;
    const {
      main_color, sub_color, alpha_subcard, exp_color,
      expNextLevel_color, text_color, name_color, level_color,
      rank_color, line_color, exp_text_color, exp, expNextLevel,
      name, level, rank, avatar, fontName, textSize
    } = this;

    const marginRatio = percentage(widthCard);
    const heightCardRatio = percentage(heightCard);

    const canvas = Canvas.createCanvas(widthCard, heightCard);
    const ctx = canvas.getContext("2d");

    const radius = 30;
    ctx.beginPath();
    ctx.moveTo(radius, 0);
    ctx.lineTo(widthCard - radius, 0);
    ctx.quadraticCurveTo(widthCard, 0, widthCard, radius);
    ctx.lineTo(widthCard, heightCard - radius);
    ctx.quadraticCurveTo(widthCard, heightCard, widthCard - radius, heightCard);
    ctx.lineTo(radius, heightCard);
    ctx.quadraticCurveTo(0, heightCard, 0, heightCard - radius);
    ctx.lineTo(0, radius);
    ctx.quadraticCurveTo(0, 0, radius, 0);
    ctx.closePath();
    ctx.clip();

    if (Array.isArray(main_color)) {
      const gradient = ctx.createLinearGradient(0, 0, widthCard, 0);
      const step = 1 / (main_color.length - 1);
      main_color.forEach((color, index) => {
        gradient.addColorStop(index * step, color);
      });
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, widthCard, heightCard);
    }
    else if (typeof main_color === 'string' && main_color.startsWith("http")) {
      try {
        const image = await Canvas.loadImage(main_color);
        ctx.drawImage(image, 0, 0, widthCard, heightCard);
      } catch (e) {
        ctx.fillStyle = main_color;
        ctx.fillRect(0, 0, widthCard, heightCard);
      }
    }
    else {
      ctx.fillStyle = main_color;
      ctx.fillRect(0, 0, widthCard, heightCard);
    }

    ctx.globalAlpha = alpha_subcard;
    const margin = 2.5 * marginRatio;
    const widthSubCard = widthCard - margin * 2;
    const heightSubCard = heightCard - margin * 2;
    const xSubCard = margin;
    const ySubCard = margin;
    const radiusSubCard = 30;

    ctx.beginPath();
    ctx.moveTo(xSubCard + radiusSubCard, ySubCard);
    ctx.lineTo(xSubCard + widthSubCard - radiusSubCard, ySubCard);
    ctx.quadraticCurveTo(xSubCard + widthSubCard, ySubCard, xSubCard + widthSubCard, ySubCard + radiusSubCard);
    ctx.lineTo(xSubCard + widthSubCard, ySubCard + heightSubCard - radiusSubCard);
    ctx.quadraticCurveTo(xSubCard + widthSubCard, ySubCard + heightSubCard, xSubCard + widthSubCard - radiusSubCard, ySubCard + heightSubCard);
    ctx.lineTo(xSubCard + radiusSubCard, ySubCard + heightSubCard);
    ctx.quadraticCurveTo(xSubCard, ySubCard + heightSubCard, xSubCard, ySubCard + heightSubCard - radiusSubCard);
    ctx.lineTo(xSubCard, ySubCard + radiusSubCard);
    ctx.quadraticCurveTo(xSubCard, ySubCard, xSubCard + radiusSubCard, ySubCard);
    ctx.closePath();
    ctx.save();
    ctx.clip();

    if (Array.isArray(sub_color)) {
      const gradient = ctx.createLinearGradient(0, 0, widthCard, 0);
      const step = 1 / (sub_color.length - 1);
      sub_color.forEach((color, index) => {
        gradient.addColorStop(index * step, color);
      });
      ctx.fillStyle = gradient;
      ctx.fillRect(xSubCard, ySubCard, widthSubCard, heightSubCard);
    }
    else if (typeof sub_color === 'string' && sub_color.startsWith("http")) {
      try {
        const image = await Canvas.loadImage(sub_color);
        ctx.drawImage(image, xSubCard, ySubCard, widthSubCard, heightSubCard);
      } catch (e) {
        ctx.fillStyle = sub_color;
        ctx.fillRect(xSubCard, ySubCard, widthSubCard, heightSubCard);
      }
    }
    else {
      ctx.fillStyle = sub_color;
      ctx.fillRect(xSubCard, ySubCard, widthSubCard, heightSubCard);
    }

    ctx.restore();
    ctx.globalAlpha = 1;

    const widthAvatar = 75 * heightCardRatio;
    const heightAvatar = widthAvatar;
    const marginAvatar = 5 * marginRatio;
    const xAvatar = marginAvatar;
    const yAvatar = heightCard / 2 - heightAvatar / 2;

    if (avatar) {
      try {
        ctx.save();
        ctx.beginPath();
        ctx.arc(xAvatar + widthAvatar / 2, yAvatar + heightAvatar / 2, widthAvatar / 2, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
        const avatarImage = await Canvas.loadImage(avatar);
        ctx.drawImage(avatarImage, xAvatar, yAvatar, widthAvatar, heightAvatar);
        ctx.restore();
      } catch (e) {
        ctx.restore();
      }
    }

    const lineX = xAvatar + widthAvatar + marginAvatar;
    const lineY = ySubCard + 20 * heightCardRatio;
    const lineHeight = heightSubCard - 40 * heightCardRatio;
    const lineWidth = 2;

    if (line_color) {
      ctx.beginPath();
      ctx.moveTo(lineX, lineY);
      ctx.lineTo(lineX, lineY + lineHeight);
      if (Array.isArray(line_color)) {
        const gradient = ctx.createLinearGradient(0, lineY, 0, lineY + lineHeight);
        const step = 1 / (line_color.length - 1);
        line_color.forEach((color, index) => {
          gradient.addColorStop(index * step, color);
        });
        ctx.strokeStyle = gradient;
      }
      else
        ctx.strokeStyle = line_color;
      ctx.lineWidth = lineWidth;
      ctx.stroke();
    }

    const marginTextArea = 3 * marginRatio;
    const xTextArea = lineX + marginTextArea;
    const widthTextArea = widthSubCard - xTextArea;

    const sizeTextName = 60 + textSize;
    ctx.font = `${sizeTextName}px ${fontName}`;
    const yTextName = ySubCard + 33 * heightCardRatio + sizeTextName;
    ctx.fillStyle = name_color || text_color;
    ctx.fillText(name, xTextArea, yTextName);

    const sizeTextLevelRank = 45 + textSize;
    ctx.font = `${sizeTextLevelRank}px ${fontName}`;
    const yTextLevelRank = yTextName + sizeTextLevelRank + 10 * heightCardRatio;
    const textLevel = `المستوى ${level}`;
    ctx.fillStyle = level_color || text_color;
    ctx.fillText(textLevel, xTextArea, yTextLevelRank);

    const marginTextRank = 3 * marginRatio;
    const textRank = `المرتبة ${rank}`;
    const widthTextRank = ctx.measureText(textRank).width;
    const xTextRank = widthCard - marginTextRank - widthTextRank - margin;
    ctx.fillStyle = rank_color || text_color;
    ctx.fillText(textRank, xTextRank, yTextLevelRank);

    const heightExpBar = 30 * heightCardRatio;
    const widthExpBar = widthSubCard - xTextArea - marginTextRank - margin;
    const xExpBar = xTextArea;
    const yExpBar = yTextLevelRank + 15 * heightCardRatio;
    const radiusExpBar = 10 * heightCardRatio;

    ctx.beginPath();
    ctx.moveTo(xExpBar + radiusExpBar, yExpBar);
    ctx.lineTo(xExpBar + widthExpBar - radiusExpBar, yExpBar);
    ctx.quadraticCurveTo(xExpBar + widthExpBar, yExpBar, xExpBar + widthExpBar, yExpBar + radiusExpBar);
    ctx.lineTo(xExpBar + widthExpBar, yExpBar + heightExpBar - radiusExpBar);
    ctx.quadraticCurveTo(xExpBar + widthExpBar, yExpBar + heightExpBar, xExpBar + widthExpBar - radiusExpBar, yExpBar + heightExpBar);
    ctx.lineTo(xExpBar + radiusExpBar, yExpBar + heightExpBar);
    ctx.quadraticCurveTo(xExpBar, yExpBar + heightExpBar, xExpBar, yExpBar + heightExpBar - radiusExpBar);
    ctx.lineTo(xExpBar, yExpBar + radiusExpBar);
    ctx.quadraticCurveTo(xExpBar, yExpBar, xExpBar + radiusExpBar, yExpBar);
    ctx.closePath();
    ctx.save();
    ctx.clip();

    ctx.fillStyle = expNextLevel_color;
    ctx.fillRect(xExpBar, yExpBar, widthExpBar, heightExpBar);

    const widthExp = widthExpBar * (exp / Math.max(expNextLevel, 1));
    ctx.fillStyle = exp_color;
    ctx.fillRect(xExpBar, yExpBar, widthExp, heightExpBar);
    ctx.restore();

    const sizeTextExp = 30 + textSize;
    ctx.font = `${sizeTextExp}px ${fontName}`;
    const textExp = `${exp}/${expNextLevel}`;
    const widthTextExp = ctx.measureText(textExp).width;
    const xTextExp = xExpBar + widthExpBar / 2 - widthTextExp / 2;
    const yTextExp = yExpBar + heightExpBar / 2 + sizeTextExp / 2 - 5;
    ctx.fillStyle = exp_text_color || text_color;
    ctx.fillText(textExp, xTextExp, yTextExp);

    return canvas.createPNGStream();
  }
}

class RankCommand {
  constructor() {
    this.name = "رانك";
    this.author = "Yamada KJ";
    this.cooldowns = 5;
    this.description = "عرض مستواك أو مستوى الشخص المُشار إليه";
    this.role = 0;
    this.aliases = ["rank", "مستوى", "رتبة"];
  }

  async execute({ api, event, args, Users, Threads }) {
    try {
      api.setMessageReaction("⏳", event.messageID, (err) => {}, true);

      let targetUsers;
      const arrayMentions = Object.keys(event.mentions || {});

      if (arrayMentions.length === 0)
        targetUsers = [event.senderID];
      else
        targetUsers = arrayMentions;

      const rankCards = await Promise.all(targetUsers.map(async userID => {
        try {
          const rankCard = await makeRankCard(userID, Users, Threads, event.threadID, deltaNext, api);
          return rankCard;
        } catch (e) {
          console.error("[RANK] Error making card:", e.message);
          return null;
        }
      }));

      const validCards = rankCards.filter(c => c !== null);
      if (validCards.length === 0) {
        api.setMessageReaction("❌", event.messageID, (err) => {}, true);
        return api.sendMessage("❌ حدث خطأ في إنشاء بطاقة المرتبة", event.threadID, event.messageID);
      }

      api.setMessageReaction("✅", event.messageID, (err) => {}, true);
      return api.sendMessage({
        attachment: validCards
      }, event.threadID);

    } catch (err) {
      console.error("[RANK] Error:", err);
      api.setMessageReaction("❌", event.messageID, (err) => {}, true);
      api.sendMessage("❌ حدث خطأ في الأمر: " + err.message, event.threadID, event.messageID);
    }
  }

  async onReply({ api, event, Users }) {
    try {
      let userData = await Users.get(event.senderID);
      let { exp = 0 } = userData;
      if (isNaN(exp) || typeof exp !== "number")
        exp = 0;
      await Users.set(event.senderID, {
        exp: exp + 1
      });
    } catch (e) {
      console.warn("[RANK] Warning: Could not update exp");
    }
  }
}

export default new RankCommand();
