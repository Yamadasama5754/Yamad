export default {
  name: "حضن",
  author: "Kaguya Project",
  role: 0,
  description: "احتضن أحداً واحصل على أموال",
  aliases: ["hug", "عناق"],
  cooldowns: 300,

  async execute({ api, event, args, Economy }) {
    try {
      const cost = 200;
      const userBalance = (await Economy.getBalance(event.senderID)).data;
      
      if (userBalance < cost) {
        return api.sendMessage(
          `⚠️ | تحتاج إلى ${cost} دولار للاحتضان`,
          event.threadID
        );
      }

      if (!args[0]) {
        return api.sendMessage(
          `❌ | الاستخدام: .حضن [@المستخدم]\nمثال: .حضن @Ahmed`,
          event.threadID
        );
      }

      await Economy.decrease(cost, event.senderID);

      const rewards = [300, 400, 500, 600, 350, 700, 250, 450, 550];
      const randomReward = rewards[Math.floor(Math.random() * rewards.length)];
      
      await Economy.increase(randomReward, event.senderID);

      const messages = [
        `🤗 | احتضنت ${args[0]} وشعرت بالحب!\n❤️ حصلت على: **${randomReward}** دولار من السعادة`,
        `💕 | عناق دافئ جداً!\n😊 حصلت على: **${randomReward}** دولار`,
        `🫂 | احتضان مجاني من الحب والود!\n💖 كسبت: **${randomReward}** دولار`,
        `😍 | احتضان خاص جداً!\n🎁 حصلت على: **${randomReward}** دولار`
      ];

      const randomMsg = messages[Math.floor(Math.random() * messages.length)];
      api.setMessageReaction("🤗", event.messageID, (err) => {}, true);
      return api.sendMessage(randomMsg, event.threadID);

    } catch (error) {
      console.error("[HUG] Error:", error.message);
      return api.sendMessage("❌ | حدث خطأ، يرجى المحاولة لاحقاً", event.threadID);
    }
  }
};
