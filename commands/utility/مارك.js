import { loadImage, createCanvas } from "canvas";
import fs from "fs-extra";
import path from "path";
import axios from "axios";

class MarkCommand {
  constructor() {
    this.name = "مارك";
    this.author = "S H A D O W";
    this.role = 0;
    this.description = "الكتابة على منشور مزيف لمارك";
    this.cooldowns = 10;
    this.aliases = ["mark"];
  }

  wrapText(ctx, text, maxWidth) {
    return new Promise(resolve => {
      if (ctx.measureText(text).width < maxWidth) return resolve([text]);
      if (ctx.measureText('W').width > maxWidth) return resolve(null);
      const words = text.split(' ');
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

  async execute({ api, event, args }) {
    const { senderID, threadID, messageID } = event;
    let text = args.join(" ");

    if (!text) {
      return api.sendMessage("❌ | أدخل نص للتعليق على الصورة.", threadID, messageID);
    }

    try {
      const tempDir = path.join(process.cwd(), "temp");
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const pathImg = path.join(tempDir, `mark_${Date.now()}.png`);

      // استخدام صورة خلفية بيضاء موثوقة من imgur
      const markCardUrl = "https://imgur.com/neYz0Wy.png";
      let rankCard;
      
      try {
        const response = await axios.get(markCardUrl, { 
          responseType: 'arraybuffer',
          timeout: 10000 
        });
        rankCard = response.data;
      } catch (err) {
        // إذا فشلت الصورة، نستخدم صورة بيضاء بسيطة
        rankCard = null;
      }

      let baseImage;
      if (rankCard) {
        fs.writeFileSync(pathImg, Buffer.from(rankCard, 'binary'));
        baseImage = await loadImage(pathImg);
      } else {
        // إنشاء صورة بيضاء بسيطة إذا فشل التحميل
        const canvas = createCanvas(934, 282);
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, 934, 282);
        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync(pathImg, buffer);
        baseImage = await loadImage(pathImg);
      }

      const canvas = createCanvas(baseImage.width, baseImage.height);
      const ctx = canvas.getContext("2d");

      ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);
      ctx.font = "400 45px Arial";
      ctx.fillStyle = "#000000";
      ctx.textAlign = "start";

      let fontSize = 45;
      while (ctx.measureText(text).width > 2600) {
        fontSize--;
        ctx.font = `400 ${fontSize}px Arial, sans-serif`;
      }

      const lines = await this.wrapText(ctx, text, 1160);
      ctx.fillText(lines.join('\n'), 60, 100);

      const imageBuffer = canvas.toBuffer();
      fs.writeFileSync(pathImg, imageBuffer);

      return api.sendMessage({
        attachment: fs.createReadStream(pathImg)
      }, threadID, () => {
        if (fs.existsSync(pathImg)) fs.unlinkSync(pathImg);
      }, messageID);

    } catch (error) {
      console.error("❌ خطأ في أمر مارك:", error);
      api.sendMessage("❌ | حدث خطأ أثناء إنشاء الصورة: " + error.message, threadID, messageID);
    }
  }
}

export default new MarkCommand();
