import axios from "axios";
import fs from "fs";
import path from "path";

const DEVELOPER_ID = "100092990751389";

class DailyGift {
  constructor() {
    this.name = "هدية";
    this.author = "Kaguya Project";
    this.role = 0;
    this.description = "احصل على مكافأة يومية كل ساعة";
    this.cooldowns = 3600;
    this.aliases = ["هديه", "جائزة"];
  }

  async execute({ api, event, Economy, Users }) {
    const currentTime = Math.floor(Date.now() / 1000);
    const timeStamps = this.cooldowns;

    try {
      api.setMessageReaction("⏳", event.messageID, (err) => {}, true);

      // المطور لا يحتاج Cooldown
      if (event.senderID !== DEVELOPER_ID) {
        const lastCheckedTime = await Users.find(event.senderID);
        const lastCooldown = lastCheckedTime?.data?.data?.other?.cooldowns_gift;

        if (lastCooldown && currentTime - parseInt(lastCooldown) < timeStamps) {
          const remainingTime = timeStamps - (currentTime - lastCooldown);
          const minutes = Math.floor(remainingTime / 60);
          const seconds = remainingTime % 60;
          api.setMessageReaction("⏱️", event.messageID, (err) => {}, true);
          return api.sendMessage(
            `⚠️ | لقد حصلت على مكافأتك بالفعل\n⏱️ | قم بالعودة بعد: ${minutes}د ${seconds}ث`,
            event.threadID
          );
        }
      }

      // قائمة المكافآت اليومية
      const dailyRewards = [5000, 1000, 1050, 1600, 1000, 1009, 1200, 1000, 1400, 1581, 1980, 9910, 1697, 6955, 6900, 6990, 4231, 5482, 1158, 1151, 5400];

      const randomIndex = Math.floor(Math.random() * dailyRewards.length);
      const rewardAmount = dailyRewards[randomIndex];

      if (event.senderID !== DEVELOPER_ID) {
        await Economy.increase(rewardAmount, event.senderID);
      }
      if (event.senderID !== DEVELOPER_ID) {
        await Users.update(event.senderID, {
          other: {
            cooldowns_gift: currentTime,
          },
        });
      }

      api.setMessageReaction("✅", event.messageID, (err) => {}, true);

      try {
        const response = await axios.get("https://i.imgur.com/t5VGSUZ.gif", {
          responseType: "arraybuffer",
          timeout: 15000
        });

        const cacheDir = path.join(process.cwd(), "cache");
        if (!fs.existsSync(cacheDir)) {
          fs.mkdirSync(cacheDir, { recursive: true });
        }

        const imagePath = path.join(cacheDir, `gift_${Date.now()}.gif`);
        fs.writeFileSync(imagePath, Buffer.from(response.data, "binary"));

        const messageBody = `✅ | 𝔞𝔠𝔱𝔦𝔳𝔞𝔱𝔦𝔫𝔤 𝔯𝔢𝔱𝔞𝔦𝔯𝔞𝔥!\n\n🎁 مكافأتك: **${rewardAmount}** دولار💰`;

        api.sendMessage({
          body: messageBody,
          attachment: fs.createReadStream(imagePath)
        }, event.threadID, () => {
          setTimeout(() => {
            try {
              fs.unlinkSync(imagePath);
            } catch (e) {}
          }, 3000);
        });

      } catch (gifErr) {
        console.warn("[GIFT] Failed to load GIF:", gifErr.message);
        return api.sendMessage(
          `✅ | 𝔞𝔠𝔱𝔦𝔳𝔞𝔠𝔦ó𝔫 𝔠𝔬𝔪𝔢𝔱𝔦𝔫𝔞!\n\n🎁 مكافأتك: **${rewardAmount}** دولار💰`,
          event.threadID
        );
      }

    } catch (error) {
      console.error("[GIFT] Error:", error.message);
      api.setMessageReaction("❌", event.messageID, (err) => {}, true);
      api.sendMessage("❌ | حدث خطأ، يرجى المحاولة لاحقاً", event.threadID);
    }
  }
}

export default new DailyGift();
