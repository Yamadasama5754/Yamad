import { loadImage, createCanvas } from "canvas";
import fs from "fs-extra";
import axios from "axios";
import path from "path";

class HackerCommand {
  constructor() {
    this.name = "هكر";
    this.author = "S H A D O W";
    this.role = 0;
    this.description = "تهكير حساب أي شخص";
    this.cooldowns = 120;
    this.aliases = ["hacker"];
  }

  wrapText(ctx, name, maxWidth) {
    return new Promise(resolve => {
      if (ctx.measureText(name).width < maxWidth) return resolve([name]);
      if (ctx.measureText('W').width > maxWidth) return resolve(null);
      const words = name.split(' ');
      const lines = [];
      let line = '';
      while (words.length > 0) {
        let split = false;
        while (ctx.measureText(words[0]).width >= maxWidth) {
          const temp = words[0];
          words[0] = temp.slice(0, -1);
          if (split) words[1] = `${temp.slice(-1)}${words[1]}`;
          else {
            split = true;
            words.splice(1, 0, temp.slice(-1));
          }
        }
        if (ctx.measureText(`${line}${words[0]}`).width < maxWidth) line += `${words.shift()} `;
        else {
          lines.push(line.trim());
          line = '';
        }
        if (words.length === 0) lines.push(line.trim());
      }
      return resolve(lines);
    });
  }

  async execute({ event, api, args, Users }) {
    try {
      api.setMessageReaction("⏳", event.messageID, (err) => {}, true);

      const mention = Object.keys(event.mentions);
      let id = mention.length > 0 ? mention[0] : event.senderID;

      const name = await Users.getNameUser(id);
      const cacheDir = path.join(process.cwd(), "cache");

      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }

      const pathImg = path.join(cacheDir, `hacker_${Date.now()}.png`);
      const pathAvt = path.join(cacheDir, `avatar_${Date.now()}.png`);

      // خلفية الهكر
      const backgroundUrl = "https://i.imgur.com/VQXViKI.png";

      let getAvatar;
      let getBackground;

      try {
        const avatarResponse = await axios.get(
          `https://graph.facebook.com/${id}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`,
          { responseType: "arraybuffer", timeout: 10000 }
        );
        getAvatar = avatarResponse.data;
      } catch (e) {
        console.error("Failed to get avatar:", e.message);
        api.setMessageReaction("❌", event.messageID, (err) => {}, true);
        return api.sendMessage("❌ | فشل الحصول على صورة البروفايل", event.threadID, event.messageID);
      }

      try {
        const bgResponse = await axios.get(backgroundUrl, {
          responseType: "arraybuffer",
          timeout: 10000
        });
        getBackground = bgResponse.data;
      } catch (e) {
        console.error("Failed to get background:", e.message);
        api.setMessageReaction("❌", event.messageID, (err) => {}, true);
        return api.sendMessage("❌ | فشل الحصول على الخلفية", event.threadID, event.messageID);
      }

      fs.writeFileSync(pathAvt, Buffer.from(getAvatar, "utf-8"));
      fs.writeFileSync(pathImg, Buffer.from(getBackground, "utf-8"));

      const baseImage = await loadImage(pathImg);
      const baseAvt = await loadImage(pathAvt);

      const canvas = createCanvas(baseImage.width, baseImage.height);
      const ctx = canvas.getContext("2d");

      ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);
      ctx.font = "400 23px Arial";
      ctx.fillStyle = "#1878F3";
      ctx.textAlign = "start";

      const lines = await this.wrapText(ctx, name, 1160);
      ctx.fillText(lines.join('\n'), 200, 497);
      ctx.drawImage(baseAvt, 83, 437, 100, 101);

      const imageBuffer = canvas.toBuffer();
      fs.writeFileSync(pathImg, imageBuffer);
      fs.removeSync(pathAvt);

      api.setMessageReaction("✅", event.messageID, (err) => {}, true);
      return api.sendMessage(
        { body: `🔓 تم تهكير حساب ${name}`, attachment: fs.createReadStream(pathImg) },
        event.threadID,
        () => {
          if (fs.existsSync(pathImg)) fs.unlinkSync(pathImg);
        },
        event.messageID
      );

    } catch (error) {
      console.error("❌ خطأ في أمر هكر:", error);
      api.setMessageReaction("❌", event.messageID, (err) => {}, true);
      api.sendMessage("❌ | حدث خطأ: " + error.message, event.threadID, event.messageID);
    }
  }
}

export default new HackerCommand();
