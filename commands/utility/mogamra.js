import axios from 'axios';

class MogamraCommand {
  constructor() {
    this.name = "مغامره";
    this.author = "لوفي وريان تشان & محسّن";
    this.cooldowns = 5;
    this.description = "مغامرة تفاعلية في منزل العائلة آدمز 🏚️";
    this.role = 0;
    this.aliases = ["مغامرة", "mogamra", "قصة"];
    this.apiServer = "https://games.proarcoder.repl.co/QSR";
  }

  async execute({ api, event }) {
    try {
      api.setMessageReaction("🎮", event.messageID, (err) => {}, true);

      const uid = event.senderID;
      
      const res = await axios.get(this.apiServer, {
        params: {
          playerID: uid
        },
        timeout: 10000
      });

      if (!res.data || !res.data.message) {
        throw new Error("استجابة غير صحيحة من السيرفر");
      }

      api.setMessageReaction("✅", event.messageID, (err) => {}, true);
      
      api.sendMessage({ body: res.data.message }, event.threadID, (error, info) => {
        if (!error && info) {
          global.client.handler.reply.set(info.messageID, {
            name: this.name,
            author: this.author,
            playerID: uid,
            messageID: info.messageID
          });
        }
      });

    } catch (error) {
      console.error("[MOGAMRA] خطأ:", error);
      api.setMessageReaction("❌", event.messageID, (err) => {}, true);
      api.sendMessage(
        "❌ خطأ في تحميل المغامرة: " + (error.message || "حدث خطأ ما"),
        event.threadID,
        event.messageID
      );
    }
  }

  async onReply({ api, event, reply }) {
    try {
      const uid = event.senderID;
      
      // تحقق من أن اللاعب هو صاحب اللعبة
      if (uid !== reply.playerID) {
        return api.sendMessage("❌ أنت لست لاعب هذه المغامرة!", event.threadID);
      }

      api.setMessageReaction("🎯", event.messageID, (err) => {}, true);

      // تحويل الخيارات (1, 2, 3) إلى الأحرف (A, B, C)
      const answerMap = {
        "1": "A",
        "2": "B",
        "3": "C"
      };

      const playerAnswer = answerMap[event.body.trim()];

      if (!playerAnswer) {
        return api.sendMessage(
          "❌ يرجى الرد برقم من 1 إلى 3",
          event.threadID
        );
      }

      const res = await axios.get(this.apiServer, {
        params: {
          playerID: uid,
          playerAnswer: playerAnswer
        },
        timeout: 10000
      });

      if (!res.data || !res.data.message) {
        throw new Error("استجابة غير صحيحة من السيرفر");
      }

      // حذف الرسالة السابقة
      try {
        api.unsendMessage(reply.messageID);
      } catch (e) {
        console.warn("[MOGAMRA] تعذر حذف الرسالة السابقة");
      }

      api.setMessageReaction("✅", event.messageID, (err) => {}, true);
      
      api.sendMessage({ body: res.data.message }, event.threadID, (error, info) => {
        if (!error && info) {
          global.client.handler.reply.set(info.messageID, {
            name: this.name,
            author: this.author,
            playerID: uid,
            messageID: info.messageID
          });
        }
      });

    } catch (error) {
      console.error("[MOGAMRA] خطأ في onReply:", error);
      api.setMessageReaction("❌", event.messageID, (err) => {}, true);
      api.sendMessage(
        "❌ خطأ في متابعة المغامرة: " + (error.message || "حدث خطأ ما"),
        event.threadID,
        event.messageID
      );
    }
  }
}

export default new MogamraCommand();
