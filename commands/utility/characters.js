import fs from "fs";
import axios from "axios";
import path from "path";

const tempImageFilePath = path.join(process.cwd(), "cache", "tempImage.jpg");
const userDataFile = path.join(process.cwd(), 'charactersPoints.json');
const bankFilePath = path.join(process.cwd(), 'bank.json');

// تأكد من وجود ملف البيانات
if (!fs.existsSync(userDataFile)) {
  fs.writeFileSync(userDataFile, '{}');
}

// تأكد من وجود ملف البنك
if (!fs.existsSync(bankFilePath)) {
  fs.writeFileSync(bankFilePath, '{}');
}

// تأكد من وجود مجلد cache
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

  async execute({ api, event, Economy }) {
    try {
      const cost = 500;
      const userBalance = (await Economy.getBalance(event.senderID)).data;
      
      if (userBalance < cost) {
        api.setMessageReaction("❌", event.messageID, (err) => {}, true);
        return api.sendMessage(
          `⚠️ | تحتاج إلى ${cost} دولار في محفظتك للعب`,
          event.threadID
        );
      }

      api.setMessageReaction("⏳", event.messageID, (err) => {}, true);

      const randomCharacter = characters[Math.floor(Math.random() * characters.length)];

      const imageResponse = await axios.get(randomCharacter.image, {
        responseType: "arraybuffer",
        timeout: 15000
      });

      fs.writeFileSync(tempImageFilePath, Buffer.from(imageResponse.data, "binary"));

      await Economy.decrease(cost, event.senderID);

      const attachment = [fs.createReadStream(tempImageFilePath)];
      const message = `▱▱▱▱▱▱▱▱▱▱▱▱▱\n🎮 ما هو اسم هذه الشخصية؟\n💸 رسم اللعبة: ${cost} دولار\n▱▱▱▱▱▱▱▱▱▱▱▱▱`;

      api.setMessageReaction("✅", event.messageID, (err) => {}, true);

      api.sendMessage({ body: message, attachment }, event.threadID, (error, info) => {
        if (!error) {
          global.client.handler.reply.set(info.messageID, {
            author: event.senderID,
            type: "reply",
            name: "شخصيات",
            correctName: randomCharacter.name,
            cost: cost,
            unsend: true
          });
        } else {
          console.error("[CHARACTERS] Error sending message:", error);
        }
      });

    } catch (error) {
      console.error("[CHARACTERS] Error executing the game:", error.message);
      api.setMessageReaction("❌", event.messageID, (err) => {}, true);
      api.sendMessage("❌ | حدث خطأ أثناء تحميل اللعبة، يرجى المحاولة لاحقاً", event.threadID);
    }
  }

  async onReply({ api, event, reply, Economy }) {
    try {
      if (reply && reply.type === "reply" && reply.name === "شخصيات") {
        const userGuess = event.body.trim();
        const correctName = reply.correctName;
        const cost = reply.cost || 500;
        const currentTime = Math.floor(Date.now() / 1000);

        let userData = null;
        try {
          const userInfo = await api.getUserInfo(event.senderID);
          userData = userInfo[event.senderID];
        } catch (e) {
          console.warn("[CHARACTERS] Could not get user info");
        }

        const userName = userData?.name || "اللاعب";

        if (userGuess === correctName) {
          try {
            // إضافة الجائزة للبنك
            const reward = 2500;
            const bankData = JSON.parse(fs.readFileSync(bankFilePath, 'utf8'));
            if (!bankData[event.senderID]) {
              bankData[event.senderID] = { balance: 0, lastInterestClaimed: currentTime, transactions: [], loans: [], level: 1 };
            }
            bankData[event.senderID].balance += reward;
            bankData[event.senderID].transactions = bankData[event.senderID].transactions || [];
            bankData[event.senderID].transactions.push({
              type: "game_win",
              amount: reward,
              timestamp: currentTime,
              description: "جائزة من لعبة الشخصيات"
            });
            fs.writeFileSync(bankFilePath, JSON.stringify(bankData, null, 2));

            // إضافة النقاط
            const pointsData = JSON.parse(fs.readFileSync(userDataFile, 'utf8'));
            const userPoints = pointsData[event.senderID] || { name: userName, points: 0 };
            userPoints.points += 50;
            pointsData[event.senderID] = userPoints;
            fs.writeFileSync(userDataFile, JSON.stringify(pointsData, null, 2));

            api.setMessageReaction("✅", event.messageID, (err) => {}, true);
            api.sendMessage(
              `✅ | تهانينا يا ${userName}! 🥳\nلقد خمنت اسم الشخصية بشكل صحيح!\n💰 تم إضافة ${reward} دولار للبنك\n⭐ حصلت على 50 نقطة!`,
              event.threadID,
              event.messageID
            );

            try {
              api.unsendMessage(reply.messageID);
            } catch (e) {}

          } catch (e) {
            console.error("[CHARACTERS] Error handling winning action:", e.message);
          }
        } else {
          api.setMessageReaction("❌", event.messageID, (err) => {}, true);
          api.sendMessage(
            `❌ | آسفة يا ${userName}! 😅\nاسم الشخصية الصحيح هو: **${correctName}**\n💸 خسرت ${cost} دولار\nحاول مرة أخرى! 💪`,
            event.threadID,
            event.messageID
          );
        }

        // حذف الصورة المؤقتة
        try {
          if (fs.existsSync(tempImageFilePath)) {
            fs.unlinkSync(tempImageFilePath);
          }
        } catch (e) {}
      }
    } catch (error) {
      console.error("[CHARACTERS] Error in onReply:", error.message);
    }
  }
}

export default new CharacterGame();
