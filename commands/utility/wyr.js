import axios from "axios";

class WYRCommand {
  constructor() {
    this.name = "لوخيروك";
    this.author = "KAGUYA PROJECT & محسّن";
    this.cooldowns = 5;
    this.description = "لعبة لو خيروك بسؤال عشوائي 🎲 مع إحصائيات";
    this.role = 0;
    this.aliases = ["لوخيروك", "wyr", "خيار"];
  }

  async translateText(text) {
    try {
      const response = await axios.get(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ar&dt=t&q=${encodeURIComponent(text)}`,
        { timeout: 10000 }
      );
      return response?.data?.[0]?.[0]?.[0] || text;
    } catch (error) {
      console.warn("[WYR] خطأ في الترجمة:", error.message);
      return text;
    }
  }

  async execute({ api, event }) {
    try {
      api.setMessageReaction("🎲", event.messageID, () => {}, true);

      const response = await axios.get("https://api.popcat.xyz/wyr", {
        timeout: 10000
      });

      if (response.status !== 200 || !response.data || !response.data.ops1 || !response.data.ops2) {
        throw new Error("Invalid or missing response from the API");
      }

      const option1 = await this.translateText(response.data.ops1);
      const option2 = await this.translateText(response.data.ops2);

      // الحصول على الإحصائيات من API
      let stats1 = response.data.votes1 || response.data.percentage_1 || 0;
      let stats2 = response.data.votes2 || response.data.percentage_2 || 0;
      
      // إذا كانت الإحصائيات نسب مئوية (أقل من 100)، حولها إلى أرقام تقريبية
      if (stats1 < 100 && stats1 > 0) stats1 = stats1 * 10;
      if (stats2 < 100 && stats2 > 0) stats2 = stats2 * 10;
      
      const totalVotes = Math.max(stats1 + stats2, 1); // تجنب القسمة على صفر
      
      let statsText = "";
      if (stats1 > 0 || stats2 > 0) {
        const percentage1 = ((stats1 / totalVotes) * 100).toFixed(1);
        const percentage2 = ((stats2 / totalVotes) * 100).toFixed(1);
        statsText = `\n\n📊 نسب الاختيار:\n1️⃣ ${percentage1}% (${Math.round(stats1)} شخص)\n2️⃣ ${percentage2}% (${Math.round(stats2)} شخص)`;
      } else {
        statsText = `\n\n📊 الإحصائيات:\n1️⃣ 50%\n2️⃣ 50%`;
      }

      const message = `لو خيروك بين:\n\n1️⃣ ${option1}\n\n2️⃣ ${option2}${statsText}\n\n👆 اختار 1 أو 2`;

      api.setMessageReaction("✅", event.messageID, () => {}, true);

      api.sendMessage(
        { body: message },
        event.threadID,
        (err, info) => {
          if (!global.client?.handler?.reply) {
            if (!global.client) global.client = {};
            if (!global.client.handler) global.client.handler = {};
            global.client.handler.reply = new Map();
          }

          global.client.handler.reply.set(info.messageID, {
            name: this.name,
            option1,
            option2,
            stats1,
            stats2,
            totalVotes
          });

          setTimeout(() => {
            try {
              global.client.handler.reply.delete(info.messageID);
            } catch (e) {}
          }, 60000);
        },
        event.messageID
      );

    } catch (error) {
      console.error("[WYR] خطأ:", error.message);
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      api.sendMessage(
        "❌ حدث خطأ أثناء جلب السؤال. حاول مرة أخرى لاحقاً.",
        event.threadID,
        event.messageID
      );
    }
  }

  async onReply({ api, event, reply }) {
    try {
      const choice = event.body.trim();

      if (choice !== "1" && choice !== "2") {
        api.setMessageReaction("❌", event.messageID, () => {}, true);
        return api.sendMessage(
          "❌ يرجى اختيار 1 أو 2 فقط",
          event.threadID,
          event.messageID
        );
      }

      let replyData = reply;
      if (!replyData || !replyData.option1) {
        if (event.messageReply && global.client?.handler?.reply) {
          replyData = global.client.handler.reply.get(event.messageReply.messageID);
        }
      }

      if (!replyData) {
        api.setMessageReaction("❌", event.messageID, () => {}, true);
        return api.sendMessage(
          "❌ انتهت صلاحية هذا السؤال. استخدم الأمر مرة أخرى.",
          event.threadID,
          event.messageID
        );
      }

      let message = "";
      if (choice === "1") {
        message = `✅ اخترت: ${replyData.option1}\n\n`;
      } else {
        message = `✅ اخترت: ${replyData.option2}\n\n`;
      }

      if (replyData.stats1 > 0 || replyData.stats2 > 0) {
        const totalVotes = Math.max(replyData.stats1 + replyData.stats2, 1);
        const percentage1 = ((replyData.stats1 / totalVotes) * 100).toFixed(1);
        const percentage2 = ((replyData.stats2 / totalVotes) * 100).toFixed(1);
        message += `📊 النسب الكلية:\n`;
        message += `1️⃣ ${percentage1}% اختاروا: ${replyData.option1}\n`;
        message += `2️⃣ ${percentage2}% اختاروا: ${replyData.option2}`;
      } else {
        message += `📊 إحصائيات متوازنة:\n`;
        message += `1️⃣ 50% اختاروا: ${replyData.option1}\n`;
        message += `2️⃣ 50% اختاروا: ${replyData.option2}`;
      }

      api.setMessageReaction("✅", event.messageID, () => {}, true);
      api.sendMessage(message, event.threadID, event.messageID);

    } catch (error) {
      console.error("[WYR] خطأ في onReply:", error.message);
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      api.sendMessage(
        "❌ حدث خطأ أثناء معالجة اختيارك.",
        event.threadID,
        event.messageID
      );
    }
  }
}

export default new WYRCommand();
