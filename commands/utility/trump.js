import { createCanvas, loadImage } from "canvas";
import axios from "axios";
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class TrumpCommand {
  constructor() {
    this.name = "ترمب";
    this.author = "عمر & محسّن";
    this.cooldowns = 10;
    this.description = "الكتابة على منشور مزيف لترامب 📰";
    this.role = 0;
    this.aliases = ["ترمب", "trump", "تويت"];
  }

  async wrapText(ctx, text, maxWidth) {
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
        
        if (ctx.measureText(`${line}${words[0]}`).width < maxWidth) {
          line += `${words.shift()} `;
        } else {
          lines.push(line.trim());
          line = '';
        }
        
        if (words.length === 0) lines.push(line.trim());
      }
      
      return resolve(lines);
    });
  }

  async execute({ api, event, args }) {
    try {
      api.setMessageReaction("⏳", event.messageID, (err) => {}, true);

      const { senderID, threadID, messageID } = event;
      const text = args.join(" ");

      if (!text) {
        api.setMessageReaction("❌", event.messageID, (err) => {}, true);
        return api.sendMessage(
          "❌ قم بكتابة نص ما لإدخاله إلى الصورة\n💡 مثال: .ترمب مرحبا بالعالم",
          threadID,
          messageID
        );
      }

      const cacheDir = path.join(__dirname, "cache");
      fs.ensureDirSync(cacheDir);
      const pathImg = path.join(cacheDir, `trump_${Date.now()}.png`);

      // تحميل الصورة الأساسية
      let imageBuffer;
      try {
        imageBuffer = (await axios.get(
          "https://nekobot.xyz/imagegen/b/2/5/5257c8eb517552857cc5e809ff0fb.png",
          { responseType: "arraybuffer", timeout: 10000 }
        )).data;
      } catch (downloadError) {
        console.error("[TRUMP] خطأ في تحميل الصورة:", downloadError.message);
        api.setMessageReaction("❌", event.messageID, (err) => {}, true);
        return api.sendMessage(
          "❌ حدث خطأ في تحميل الصورة الأساسية",
          threadID,
          messageID
        );
      }

      fs.writeFileSync(pathImg, Buffer.from(imageBuffer));

      // تحميل الصورة وإنشاء canvas
      const baseImage = await loadImage(pathImg);
      const canvas = createCanvas(baseImage.width, baseImage.height);
      const ctx = canvas.getContext("2d");

      // رسم الصورة الأساسية
      ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);

      // إعداد الخط والنص
      ctx.fillStyle = "#000000";
      ctx.textAlign = "start";
      let fontSize = 45;

      // ضبط حجم الخط بناءً على طول النص
      ctx.font = `400 ${fontSize}px Arial, sans-serif`;
      while (ctx.measureText(text).width > 2600 && fontSize > 15) {
        fontSize--;
        ctx.font = `400 ${fontSize}px Arial, sans-serif`;
      }

      // تكسير النص على عدة أسطر
      const lines = await this.wrapText(ctx, text, 1160);

      if (!lines || lines.length === 0) {
        api.setMessageReaction("❌", event.messageID, (err) => {}, true);
        return api.sendMessage(
          "❌ النص طويل جداً. يرجى تقليل عدد الأحرف",
          threadID,
          messageID
        );
      }

      // كتابة النص على الصورة
      ctx.fillText(lines.join('\n'), 60, 165);

      // حفظ الصورة
      const finalBuffer = canvas.toBuffer();
      fs.writeFileSync(pathImg, finalBuffer);

      api.setMessageReaction("✅", event.messageID, (err) => {}, true);

      api.sendMessage(
        { attachment: fs.createReadStream(pathImg) },
        threadID,
        (error, info) => {
          setTimeout(() => {
            if (fs.existsSync(pathImg)) {
              fs.unlinkSync(pathImg);
            }
          }, 1000);
        }
      );

    } catch (error) {
      console.error("[TRUMP] خطأ:", error);
      api.setMessageReaction("❌", event.messageID, (err) => {}, true);
      api.sendMessage(
        `❌ حدث خطأ: ${error.message}`,
        event.threadID,
        event.messageID
      );
    }
  }
}

export default new TrumpCommand();
