import axios from "axios";
import fs from "fs";
import path from "path";
import moment from "moment-timezone";

async function execute({ api, event, Economy }) {
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

    await Economy.decrease(cost, event.senderID);

    const choices = [
      "\n1 ≻ فيتنام",
      "\n2 ≻ المغرب",
      "\n3 ≻ اليابان",
      "\n4 ≻ تايلاند",
      "\n5 ≻ الولايات المتحدة الامريكية",
      "\n6 ≻ كمبوديا",
      "\n\n📌رد على الرسالة برقم حتى تشتغل باحدى الدول !"
    ];

    const message = choices.join("") + `\n\n💸 رسم اللعبة: ${cost} دولار`;

    api.setMessageReaction("⏳", event.messageID, (err) => {}, true);

    api.sendMessage(message, event.threadID, (err, info) => {
      if (!err) {
        global.client.handler.reply.set(info.messageID, {
          author: event.senderID,
          type: "pick",
          name: "كهف",
          unsend: true,
        });
      } else {
        console.error("[KAHF] Error sending message:", err);
      }
    });
  } catch (error) {
    console.error("[KAHF] Error executing the game:", error.message);
    api.setMessageReaction("❌", event.messageID, (err) => {}, true);
    api.sendMessage("❌ | حدث خطأ أثناء تحميل لعبة الكهف، يرجى المحاولة لاحقاً", event.threadID);
  }
}

async function onReply({ api, event, reply, Economy, Users }) {
  if (event.senderID !== reply.author) {
    return api.sendMessage("⚠️ | ليس لك.", event.threadID, event.messageID);
  }

  if (reply.type === "pick") {
    const choices = [
      "فيتنام",
      "المغرب",
      "اليابان",
      "تايلاند",
      "الولايات المتحدة الامريكية",
      "كمبوديا"
    ];

    const rewardAmounts = [5000, 4800, 4700, 4600, 4500, 4000];
    const choiceIndex = parseInt(event.body);

    if (isNaN(choiceIndex) || choiceIndex < 1 || choiceIndex > 6) {
      api.setMessageReaction("❌", event.messageID, (err) => {}, true);
      return api.sendMessage("⚠️ | أرجوك قم بالرد برقم الدولة المتوفرة (1-6).", event.threadID);
    }

    const currentTime = moment().unix();
    const cooldownPeriod = 86400;
    const cooldownKey = `cooldowns_kahf_${event.senderID}`;

    try {
      const user = await Users.find(event.senderID);
      const lastCheckedTime = user?.data?.data?.other?.[cooldownKey];

      if (lastCheckedTime && currentTime - lastCheckedTime < cooldownPeriod) {
        const remainingTime = cooldownPeriod - (currentTime - lastCheckedTime);
        const duration = moment.duration(remainingTime, 'seconds');
        api.setMessageReaction("⏱️", event.messageID, (err) => {}, true);
        return api.sendMessage(`⚠️ | لقد عملت اليوم. العودة بعد: ${duration.hours()}س ${duration.minutes()}د ${duration.seconds()}ث`, event.threadID);
      }

      api.setMessageReaction("✅", event.messageID, (err) => {}, true);

      const choiceDescription = choices[choiceIndex - 1];
      const rewardAmount = rewardAmounts[choiceIndex - 1];
      const msg = `✅ | اشتغلت في كهوف ${choiceDescription} وحصلت على **${rewardAmount}** دولار 💵`;

      await Economy.increase(rewardAmount, event.senderID);
      
      // حفظ الجائزة في البنك
      const bankFilePath = path.join(process.cwd(), 'bank.json');
      try {
        const bankData = JSON.parse(fs.readFileSync(bankFilePath, 'utf8'));
        if (!bankData[event.senderID]) {
          bankData[event.senderID] = { balance: 0, lastInterestClaimed: currentTime, transactions: [], loans: [], level: 1 };
        }
        bankData[event.senderID].balance += rewardAmount;
        bankData[event.senderID].transactions = bankData[event.senderID].transactions || [];
        bankData[event.senderID].transactions.push({
          type: "cave_reward",
          amount: rewardAmount,
          timestamp: currentTime,
          description: `جائزة من الكهف - ${choiceDescription}`
        });
        fs.writeFileSync(bankFilePath, JSON.stringify(bankData, null, 2));
      } catch (e) {
        console.error("[KAHF] Error saving to bank:", e.message);
      }

      await Users.update(event.senderID, {
        other: {
          [cooldownKey]: currentTime,
        },
      });

      api.sendMessage(msg, event.threadID);
    } catch (error) {
      console.error("[KAHF] Error handling reply:", error.message);
      api.setMessageReaction("❌", event.messageID, (err) => {}, true);
      api.sendMessage("❌ | حدث خطأ، يرجى المحاولة لاحقاً", event.threadID);
    }
  }
}

export default {
  name: "كهف",
  author: "Kaguya Project",
  cooldowns: 15,
  description: "لعبة الكهف للعمل في المناجم وكسب المال",
  role: 0,
  execute,
  onReply,
};
