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
  { name: "هيسوكا", image: "https://i.imgur.com/6Mj5GcO.jpg" },
  { name: "كورومي", image: "https://i.imgur.com/yrEx6fs.jpg" },
  { name: "الينا", image: "https://i.imgur.com/cAFukZB.jpg" },
  { name: "فوليت", image: "https://i.pinimg.com/236x/63/c7/47/63c7474adaab4e36525611da528a20bd.jpg" },
  { name: "ميدوريا", image: "https://i.pinimg.com/236x/3a/df/87/3adf878c1b6ef2a90ed32abf674b780c.jpg" },
  { name: "وين", image: "https://i.pinimg.com/564x/d2/c0/42/d2c042eeb8a92713b3f6e0a6dba2c353.jpg" },
  { name: "نينم", image: "https://i.pinimg.com/236x/f6/85/2b/f6852bfa6a09474771a17aca9018852e.jpg" },
  { name: "هانكو", image: "https://i.pinimg.com/236x/b6/0e/36/b60e36d13d8c11731c85b73e89f63189.jpg" },
  { name: "زيرو تو", image: "https://i.pinimg.com/236x/bd/9d/5a/bd9d5a5040e872d4ec9e9607561e22da.jpg" },
  { name: "ايروين", image: "https://i.pinimg.com/236x/5f/e8/f3/5fe8f3b46a33de8ce98927e95e804988.jpg" },
  { name: "تودروكي", image: "https://i.pinimg.com/474x/ab/3f/5e/ab3f5ec03eb6b18d2812f8c13c62bb92.jpg" },
  { name: "غوجو", image: "https://i.pinimg.com/236x/26/6e/8d/266e8d8e9ea0a9d474a8316b9ed54207.jpg" },
  { name: "دازاي", image: "https://i.pinimg.com/474x/e5/2f/a3/e52fa34886b53184b767b04c70ce0885.jpg" },
  { name: "فوتوبا", image: "https://i.pinimg.com/236x/03/af/3e/03af3e2769811b62eb75f1a8e63affe5.jpg" },
  { name: "سيستا", image: "https://i.pinimg.com/236x/7f/38/6c/7f386c4afed64d0055205452091a313e.jpg" },
  { name: "كيلوا", image: "https://i.pinimg.com/236x/8a/c8/f9/8ac8f98dd946fefdae4e66020073e5ee.jpg" },
  { name: "كايل", image: "https://i.pinimg.com/236x/e1/6a/5c/e16a5c5f91190ebf407ff3736135cb5a.jpg" },
  { name: "نيرو", image: "https://i.pinimg.com/564x/36/43/fc/3643fc4d86d3a7e8e60d14e71f8050a0.jpg" },
  { name: "ريوك", image: "https://i.pinimg.com/236x/3b/b5/ef/3bb5efac247e16fe3fc30c9a7478cc07.jpg" },
  { name: "تاكت", image: "https://i.pinimg.com/236x/79/9b/66/799b66006bc650a03fa264936ce254c7.jpg" }
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
