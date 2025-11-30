import fs from "fs";
import axios from "axios";
import path from "path";

const tempImageFilePath = path.join(process.cwd(), "cache", "tempImage.jpg");
const userDataFile = path.join(process.cwd(), 'charactersPoints.json');

if (!fs.existsSync(userDataFile)) {
  fs.writeFileSync(userDataFile, '{}');
}

if (!fs.existsSync(path.join(process.cwd(), 'cache'))) {
  fs.mkdirSync(path.join(process.cwd(), 'cache'), { recursive: true });
}

const characters = [
  { name: "ناروتو", image: "https://i.imgur.com/LZ9h2Cj.jpg" },
  { name: "ساسوكي", image: "https://i.imgur.com/KQuPNi2.jpg" },
  { name: "سايتاما", image: "https://i.imgur.com/RGZqW26.jpg" },
  { name: "غوكو", image: "https://i.imgur.com/YE1MhsM.png" },
  { name: "لوفي", image: "https://i.imgur.com/58Px7WU.jpg" },
  { name: "سانجي", image: "https://i.imgur.com/e8Xmt02.jpg" },
  { name: "زورو", image: "https://i.imgur.com/0VHWg66.jpg" },
  { name: "نامي", image: "https://i.imgur.com/UB010MB.jpg" },
  { name: "ايتشيغو", image: "https://i.imgur.com/MP30yUR.jpg" },
  { name: "روكيا", image: "https://i.imgur.com/HhJ1v0s.jpg" },
  { name: "تانجيرو", image: "https://i.imgur.com/hmnNKJA.jpg" },
  { name: "نيزكو", image: "https://i.imgur.com/96881ef27cbfce1071ff135b5a7e1fc7.jpg" },
  { name: "ميكاسا", image: "https://i.imgur.com/Tcxjf0z.jpg" },
  { name: "إيرين", image: "https://i.imgur.com/btjxDoY.jpg" },
  { name: "لوفاي", image: "https://i.imgur.com/g7aVAkk.jpg" },
  { name: "كاكاشي", image: "https://i.pinimg.com/236x/34/81/ba/3481ba915d12d27c1b2a094cb3369b4c.jpg" },
  { name: "ليفاي", image: "https://i.imgur.com/xzDQSD2.jpg" },
  { name: "مايكي", image: "https://i.pinimg.com/236x/eb/a1/c6/eba1c6ed1611c3332655649ef405490a.jpg" },
  { name: "هيناتا", image: "https://i.imgur.com/koAzMr9.jpg" },
  { name: "هيسوكا", image: "https://i.imgur.com/6Mj5GcO.jpg" }
];

class CharacterGame {
  constructor() {
    this.name = "شخصيات";
    this.author = "حسين يعقوبي";
    this.role = 0;
    this.description = "احزر اسم شخصية الأنمي من الصورة";
    this.cooldowns = 15;
    this.aliases = ["شخصيه", "احزر"];
  }

  async downloadImage(imageUrl, retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await axios.get(imageUrl, {
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
        console.error(`[CHARACTERS] محاولة ${i + 1} فشلت لتحميل الصورة:`, error.message);
        
        if (i < retries - 1) {
          // انتظر قبل المحاولة القادمة
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    
    throw new Error(`فشل تحميل الصورة بعد ${retries} محاولات`);
  }

  async execute({ api, event }) {
    try {
      api.setMessageReaction("⏳", event.messageID, (err) => {}, true);

      const randomCharacter = characters[Math.floor(Math.random() * characters.length)];

      let imageBuffer;
      try {
        imageBuffer = await this.downloadImage(randomCharacter.image);
      } catch (downloadError) {
        console.error("[CHARACTERS] خطأ في تحميل الصورة:", downloadError.message);
        api.setMessageReaction("❌", event.messageID, (err) => {}, true);
        return api.sendMessage(
          "❌ | حدث خطأ في تحميل الصورة، حاول مرة أخرى لاحقاً",
          event.threadID
        );
      }

      try {
        fs.writeFileSync(tempImageFilePath, imageBuffer);
      } catch (writeError) {
        console.error("[CHARACTERS] خطأ في حفظ الصورة:", writeError.message);
        api.setMessageReaction("❌", event.messageID, (err) => {}, true);
        return api.sendMessage(
          "❌ | حدث خطأ في معالجة الصورة، حاول مرة أخرى لاحقاً",
          event.threadID
        );
      }

      const attachment = [fs.createReadStream(tempImageFilePath)];
      const message = `▱▱▱▱▱▱▱▱▱▱▱▱▱\n🎮 ما هو اسم هذه الشخصية؟\n▱▱▱▱▱▱▱▱▱▱▱▱▱`;

      api.setMessageReaction("✅", event.messageID, (err) => {}, true);

      api.sendMessage({ body: message, attachment }, event.threadID, (error, info) => {
        if (!error && info && info.messageID) {
          global.client.handler.reply.set(info.messageID, {
            author: event.senderID,
            type: "reply",
            name: "شخصيات",
            correctName: randomCharacter.name,
            unsend: true
          });
        } else {
          console.error("[CHARACTERS] خطأ في إرسال الرسالة:", error?.message || "خطأ غير معروف");
        }
      });

    } catch (error) {
      console.error("[CHARACTERS] خطأ عام في تنفيذ اللعبة:", error.message, error.stack);
      api.setMessageReaction("❌", event.messageID, (err) => {}, true);
      api.sendMessage("❌ | حدث خطأ أثناء تحميل اللعبة، يرجى المحاولة لاحقاً", event.threadID);
    }
  }

  async onReply({ api, event, reply }) {
    try {
      if (reply && reply.type === "reply" && reply.name === "شخصيات") {
        const userGuess = event.body.trim();
        const correctName = reply.correctName;

        let userData = null;
        try {
          const userInfo = await api.getUserInfo(event.senderID);
          userData = userInfo[event.senderID];
        } catch (e) {
          console.warn("[CHARACTERS] تعذر الحصول على معلومات المستخدم");
        }

        const userName = userData?.name || "اللاعب";

        if (userGuess === correctName) {
          api.sendMessage(
            `✅ | تهانينا يا ${userName}! 🥳\nلقد خمنت اسم الشخصية بشكل صحيح!`,
            event.threadID,
            event.messageID
          );
          api.setMessageReaction("✅", event.messageID, (err) => {}, true);
        } else {
          api.sendMessage(
            `❌ | آسفة يا ${userName}! 😅\nاسم الشخصية الصحيح هو: **${correctName}**\nحاول مرة أخرى! 💪`,
            event.threadID,
            event.messageID
          );
          api.setMessageReaction("❌", event.messageID, (err) => {}, true);
        }
      }
    } catch (error) {
      console.error("[CHARACTERS] خطأ في معالجة الرد:", error.message);
    }
  }
}

export default new CharacterGame();
