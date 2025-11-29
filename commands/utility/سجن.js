import moment from 'moment-timezone';

export default {
  name: "سجن",
  author: "Kaguya Project",
  role: 0,
  description: "ادخل السجن واخرج بأموال",
  aliases: ["prison", "سجني"],
  cooldowns: 600,

  async execute({ api, event, Economy, Users }) {
    try {
      const cost = 1000;
      const userBalance = (await Economy.getBalance(event.senderID)).data;
      
      if (userBalance < cost) {
        return api.sendMessage(
          `⚠️ | تحتاج إلى ${cost} دولار للدخول للسجن`,
          event.threadID
        );
      }

      await Economy.decrease(cost, event.senderID);

      const chance = Math.random();
      let message = "";
      let reward = 0;

      if (chance > 0.7) {
        // الهروب الناجح
        reward = Math.floor(Math.random() * 3000) + 2000;
        await Economy.increase(reward, event.senderID);
        message = `🚔 | نجحت في الهروب من السجن!\n💰 حصلت على: **${reward}** دولار`;
        api.setMessageReaction("✅", event.messageID, (err) => {}, true);
      } else if (chance > 0.4) {
        // عمل في السجن
        reward = Math.floor(Math.random() * 2000) + 1000;
        await Economy.increase(reward, event.senderID);
        message = `⛓️ | عملت في السجن لفترة!\n💵 كسبت: **${reward}** دولار`;
        api.setMessageReaction("💼", event.messageID, (err) => {}, true);
      } else {
        // القبض عليك مجدداً
        message = `🚔 | تم القبض عليك مجدداً!\n❌ خسرت **${cost}** دولار`;
        api.setMessageReaction("❌", event.messageID, (err) => {}, true);
      }

      return api.sendMessage(message, event.threadID);

    } catch (error) {
      console.error("[PRISON] Error:", error.message);
      return api.sendMessage("❌ | حدث خطأ، يرجى المحاولة لاحقاً", event.threadID);
    }
  }
};
