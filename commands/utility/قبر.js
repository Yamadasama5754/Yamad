export default {
  name: "قبر",
  author: "Kaguya Project",
  role: 0,
  description: "ادخل القبر واكسب أموال",
  aliases: ["grave", "قبري"],
  cooldowns: 600,

  async execute({ api, event, Economy }) {
    try {
      const cost = 500;
      const userBalance = (await Economy.getBalance(event.senderID)).data;
      
      if (userBalance < cost) {
        return api.sendMessage(
          `⚠️ | تحتاج إلى ${cost} دولار للدخول للقبر`,
          event.threadID
        );
      }

      await Economy.decrease(cost, event.senderID);

      const rewards = [1500, 2000, 2500, 3000, 1000, 5000, 800, 3500, 2200, 4000];
      const randomReward = rewards[Math.floor(Math.random() * rewards.length)];
      
      await Economy.increase(randomReward, event.senderID);

      const messages = [
        `⚰️ | دخلت القبر وعثرت على كنز!\n💎 حصلت على: **${randomReward}** دولار`,
        `👻 | الأشباح أعطتك مبلغاً!\n💰 عدد: **${randomReward}** دولار`,
        `🪦 | وجدت درعاً ذهبياً في القبر!\n✨ بعته بـ: **${randomReward}** دولار`,
        `⚫ | خرجت من القبر برنين الجرس!\n🎁 اكتسبت: **${randomReward}** دولار`
      ];

      const randomMsg = messages[Math.floor(Math.random() * messages.length)];
      api.setMessageReaction("⚰️", event.messageID, (err) => {}, true);
      return api.sendMessage(randomMsg, event.threadID);

    } catch (error) {
      console.error("[GRAVE] Error:", error.message);
      return api.sendMessage("❌ | حدث خطأ، يرجى المحاولة لاحقاً", event.threadID);
    }
  }
};
