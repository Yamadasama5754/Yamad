import axios from "axios";

class WYRCommand {
  constructor() {
    this.name = "لوخيروك";
    this.author = "KAGUYA PROJECT";
    this.cooldowns = 5;
    this.description = "لعبة لو خيروك بأسئلة متسلسلة 🎲";
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
      return text;
    }
  }

  async getQuestion() {
    try {
      const response = await axios.get("https://api.popcat.xyz/wyr", {
        timeout: 10000
      });

      if (response.status !== 200 || !response.data || !response.data.ops1 || !response.data.ops2) {
        throw new Error("Invalid or missing response from the API");
      }

      const option1 = await this.translateText(response.data.ops1);
      const option2 = await this.translateText(response.data.ops2);

      return { option1, option2 };
    } catch (error) {
      console.error("[WYR] خطأ في جلب السؤال:", error.message);
      return null;
    }
  }

  async execute({ api, event }) {
    try {
      api.setMessageReaction("🎲", event.messageID, () => {}, true);

      const questionData = await this.getQuestion();
      
      if (!questionData) {
        throw new Error("فشل جلب السؤال");
      }

      const { option1, option2 } = questionData;
      const message = `🎮 لو خيروك بين:\n\n1️⃣ ${option1}\n\n2️⃣ ${option2}\n\n👆 اختار 1 أو 2\n\n(كل اختيار يفتح لعبة جديدة 🔁)`;

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
            author: event.senderID,
            isWYRGame: true
          });

          setTimeout(() => {
            try {
              global.client.handler.reply.delete(info.messageID);
            } catch (e) {}
          }, 120000);
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
      const choice = event.body.trim().toLowerCase();

      if (choice === "إيقاف" || choice === "stop" || choice === "end") {
        api.setMessageReaction("🛑", event.messageID, () => {}, true);
        return api.sendMessage(
          "🛑 انتهت اللعبة! شكراً للعب معنا 👋",
          event.threadID,
          event.messageID
        );
      }

      if (choice !== "1" && choice !== "2") {
        api.setMessageReaction("❌", event.messageID, () => {}, true);
        return api.sendMessage(
          "❌ يرجى اختيار 1 أو 2 فقط\n\n(أو اكتب 'إيقاف' لإنهاء اللعبة)",
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

      // تحقق من أن الشخص المردود عليه هو صاحب اللعبة فقط
      if (replyData.author && event.senderID !== replyData.author) {
        api.setMessageReaction("🚫", event.messageID, () => {}, true);
        return api.sendMessage(
          "🚫 فقط صاحب اللعبة يقدر يجاوب!",
          event.threadID,
          event.messageID
        );
      }

      // رسالة الاختيار
      let message = "";
      if (choice === "1") {
        message = `✅ اخترت: ${replyData.option1}\n\n`;
      } else {
        message = `✅ اخترت: ${replyData.option2}\n\n`;
      }

      api.setMessageReaction("✅", event.messageID, () => {}, true);

      // جلب سؤال جديد
      const newQuestion = await this.getQuestion();
      
      if (newQuestion) {
        const { option1, option2 } = newQuestion;
        message += `🎮 لو خيروك بين:\n\n1️⃣ ${option1}\n\n2️⃣ ${option2}\n\n👆 اختار 1 أو 2`;
        
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
              author: event.senderID,
              isWYRGame: true
            });

            setTimeout(() => {
              try {
                global.client.handler.reply.delete(info.messageID);
              } catch (e) {}
            }, 120000);
          },
          event.messageID
        );
      } else {
        message += "❌ حدث خطأ في جلب السؤال الجديد. حاول مرة أخرى بـ .لوخيروك";
        api.sendMessage(message, event.threadID, event.messageID);
      }

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
