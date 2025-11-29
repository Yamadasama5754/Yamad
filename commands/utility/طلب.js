import moment from 'moment-timezone';

export default {
  name: "طلب",
  author: "Kaguya Project",
  role: 0,
  description: "اطلب أموال من الآخرين",
  aliases: ["اطلب", "طلبات"],
  cooldowns: 300,

  async execute({ api, event, args, Economy }) {
    try {
      if (!args[0]) {
        return api.sendMessage(
          `❌ | الاستخدام: .طلب [@المستخدم] [المبلغ]\nمثال: .طلب @Ahmed 1000`,
          event.threadID
        );
      }

      const amount = parseInt(args[1], 10);
      if (isNaN(amount) || amount <= 0 || amount > 50000) {
        return api.sendMessage(
          "⚠️ | المبلغ يجب أن يكون بين 1 و 50000 دولار",
          event.threadID
        );
      }

      const userBalance = (await Economy.getBalance(event.senderID)).data;
      if (userBalance < amount) {
        return api.sendMessage(
          `⚠️ | ليس لديك ${amount} دولار في محفظتك`,
          event.threadID
        );
      }

      const chance = Math.random();
      const success = chance > 0.5;

      if (success) {
        await Economy.decrease(amount, event.senderID);
        const randomBonus = Math.floor(Math.random() * 1000) + 500;
        const totalAmount = amount + randomBonus;
        
        api.setMessageReaction("✅", event.messageID, (err) => {}, true);
        return api.sendMessage(
          `✅ | تم قبول طلبك!\n💰 حصلت على: **${totalAmount}** دولار (${amount} + مكافأة ${randomBonus})`,
          event.threadID
        );
      } else {
        await Economy.decrease(amount, event.senderID);
        api.setMessageReaction("❌", event.messageID, (err) => {}, true);
        return api.sendMessage(
          `❌ | تم رفض طلبك!\n💸 خسرت: **${amount}** دولار`,
          event.threadID
        );
      }
    } catch (error) {
      console.error("[REQUEST] Error:", error.message);
      return api.sendMessage("❌ | حدث خطأ، يرجى المحاولة لاحقاً", event.threadID);
    }
  }
};
