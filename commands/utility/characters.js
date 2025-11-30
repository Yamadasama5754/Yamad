import fs from "fs";
import path from "path";
import axios from "axios";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tempImageFilePath = path.join(__dirname, "cache", "characters.jpg");

const cacheDir = path.join(__dirname, "cache");
if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir, { recursive: true });
}

class CharactersCommand {
  constructor() {
    this.name = "تخمين";
    this.author = "KAGUYA PROJECT";
    this.cooldowns = 5;
    this.description = "تخمين اسم شخصيات الأنمي من خلال الصورة 🎲";
    this.role = 0;
    this.aliases = ["تخمين", "شخصية", "غيس"];
  }

  async onLoad() {
    console.log("[CHARACTERS] تم تحضير أمر تخمين الشخصيات بنجاح");
  }

  async execute({ api, event }) {
    try {
      const characters = [
        { answer: "اوبيتو", image: "https://i.imgur.com/zG4ehpe.png" },
        { answer: "اوروتشيمارو", image: "https://i.imgur.com/qQK7r3E.jpeg" },
        { answer: "اوسوب", image: "https://i.imgur.com/HkJ5D24.png" },
        { answer: "اوكيجي", image: "https://i.imgur.com/febnZ0y.jpeg" },
        { answer: "ايرين", image: "https://i.imgur.com/gAHKduw.png" },
        { answer: "ايتاشي", image: "https://i.imgur.com/uP01IFu.jpeg" },
        { answer: "ايتشيغو", image: "https://i.imgur.com/3ImTGnT.png" },
        { answer: "ميدوريا", image: "https://i.imgur.com/zAP7sPD.png" },
        { answer: "انيل", image: "https://i.imgur.com/eMswF26.jpeg" },
        { answer: "بارتولوميو", image: "https://i.imgur.com/aR0DAZz.png" },
        { answer: "بروك", image: "https://i.imgur.com/v0j9d3s.jpeg" },
        { answer: "بوروتو", image: "https://i.imgur.com/q58bBoG.jpeg" },
        { answer: "بيكولا", image: "https://i.imgur.com/yQCm3HI.png" },
        { answer: "ترافاجار دي لاو", image: "https://i.imgur.com/pbDipVq.jpeg" },
        { answer: "ترانكس", image: "https://i.imgur.com/4b25jQP.jpeg" },
        { answer: "جيرايا", image: "https://i.imgur.com/OluJyts.png" },
        { answer: "لوفي", image: "https://i.imgur.com/jAJSd7r.jpeg" },
        { answer: "دورايمون", image: "https://i.imgur.com/xFoxuOT.png" },
        { answer: "دوفلامينغو", image: "https://i.imgur.com/FazFYLr.png" },
        { answer: "زورو", image: "https://i.imgur.com/2kY8hov.png" },
        { answer: "سابو", image: "https://i.imgur.com/fjJ5ElD.jpeg" },
        { answer: "سانجي", image: "https://i.imgur.com/kKFx3j1.jpeg" },
        { answer: "غوكو", image: "https://i.imgur.com/LnOKuOx.png" },
        { answer: "كونان", image: "https://i.imgur.com/5ymjg5R.jpeg" },
        { answer: "غارا", image: "https://i.imgur.com/yUCd3D6.png" },
        { answer: "كابتن كورو", image: "https://i.imgur.com/aZWvR7q.jpeg" },
        { answer: "كايتو كيد", image: "https://i.imgur.com/6ckK6nT.jpeg" },
        { answer: "كوبي", image: "https://i.imgur.com/ICVEr1p.png" },
        { answer: "ياغامي لايت", image: "https://i.imgur.com/09NjhBv.jpeg" },
        { answer: "ليفاي", image: "https://i.imgur.com/zW132oo.png" },
        { answer: "ماركو", image: "https://i.imgur.com/5BunLah.png" },
        { answer: "مادارا", image: "https://i.imgur.com/OLzeUHD.png" },
        { answer: "ميكاسا", image: "https://i.imgur.com/83wmWDQ.png" },
        { answer: "نيزكو", image: "https://i.imgur.com/0UkUSR4.jpeg" }
      ];

      const randomCharacter = characters[Math.floor(Math.random() * characters.length)];
      const correctAnswer = randomCharacter.answer.toLowerCase();

      api.setMessageReaction("🎲", event.messageID, (err) => {}, true);

      let messagePayload = {
        body: "🎲 خمن اسم الشخصية?\nرد على هذه الرسالة بالاسم"
      };

      // محاولة تحميل الصورة بدون خطأ
      try {
        const imageResponse = await axios.get(randomCharacter.image, { 
          responseType: "arraybuffer", 
          timeout: 8000 
        });
        fs.writeFileSync(tempImageFilePath, Buffer.from(imageResponse.data, "binary"));
        messagePayload.attachment = fs.createReadStream(tempImageFilePath);
        console.log(`[CHARACTERS] تم تحميل الصورة: ${randomCharacter.image}`);
      } catch (imgErr) {
        console.warn(`[CHARACTERS] تعذر تحميل الصورة (${randomCharacter.image}): ${imgErr.message}`);
        // سيتم الإرسال بدون صورة
      }

      api.sendMessage(
        messagePayload, 
        event.threadID, 
        (error, info) => {
          if (!error) {
            if (!global.client?.handler?.reply) {
              if (!global.client) global.client = {};
              if (!global.client.handler) global.client.handler = {};
              global.client.handler.reply = new Map();
            }

            global.client.handler.reply.set(info.messageID, {
              name: this.name,
              correctAnswer: correctAnswer,
              image: randomCharacter.image,
              type: "characters"
            });

            setTimeout(() => {
              try {
                global.client.handler.reply.delete(info.messageID);
              } catch (e) {}
            }, 60000);
          } else {
            console.error("[CHARACTERS] خطأ في إرسال الرسالة:", error);
          }
        }, 
        event.messageID);
        
      setTimeout(() => {
        try {
          if (fs.existsSync(tempImageFilePath)) fs.unlinkSync(tempImageFilePath);
        } catch (e) {}
      }, 65000);

    } catch (error) {
      console.error("[CHARACTERS] خطأ في تنفيذ الأمر:", error);
      api.sendMessage("❌ حدث خطأ في الأمر.", event.threadID, event.messageID);
    }
  }

  async onReply({ api, event, reply }) {
    try {
      if (reply && reply.type === "characters" && reply.name === "تخمين") {
        const userAnswer = event.body.trim().toLowerCase();
        const correctAnswer = reply.correctAnswer.toLowerCase();

        const userInfo = await api.getUserInfo(event.senderID);
        const userName = userInfo ? userInfo[event.senderID].name : "المستخدم";

        // التحقق من الإجابة
        if (correctAnswer.split(' ').some(part => userAnswer.includes(part))) {
          api.setMessageReaction("✅", event.messageID, (err) => {}, true);
          
          let successMessage = `◆❯━━━━━▣✦▣━━━━━━❮◆\n✅ | تهانينا يا ${userName} 🥳\n🎯 | الجواب: ${correctAnswer}\n◆❯━━━━━▣✦▣━━━━━━❮◆`;
          
          api.sendMessage(successMessage, event.threadID, event.messageID);
        } else {
          api.setMessageReaction("❌", event.messageID, (err) => {}, true);
          api.sendMessage(`❌ | آسف، الإجابة خاطئة. حاول مرة أخرى!`, event.threadID, event.messageID);
        }
      }
    } catch (error) {
      console.error("[CHARACTERS] خطأ في onReply:", error);
    }
  }
}

export default new CharactersCommand();
