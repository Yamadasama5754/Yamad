import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class CharactersGuessCommand {
  constructor() {
    this.name = "تخمين";
    this.author = "عمر";
    this.cooldowns = 5;
    this.description = "احزر اسم الشخصية من الوصف 🎭";
    this.role = 0;
    this.aliases = ["تخمين"];
  }

  async onLoad() {
    console.log("[CHARACTERS] تم تحضير أمر تخمين الشخصيات بنجاح");
  }

  async execute({ api, event }) {
    try {
      const questions = [
        { description: "شخصية من أنمي Attack on Titan، قائد الفيلق الاستطلاعي، معروف بخطته الذكية", answer: "ايروين" },
        { description: "شخصية من Tokyo Ghoul، بشعر أبيض، قناع يغطي وجهه، مقاتل قوي", answer: "كين" },
        { description: "شخصية من My Hero Academia، يستطيع نسخ الحركات، نظارة شمسية، بطل المدرسة", answer: "كاكاشي" },
        { description: "شخصية من One Piece، قبطان طاقم القراصنة، يحب اللحم، طموحه أن يكون ملك القراصنة", answer: "لوفي" },
        { description: "شخصية من One Piece، ذو سيوف ثلاث، أخضر الشعر، كاره للخسارة", answer: "زورو" },
        { description: "شخصية من Demon Slayer، أخت كانت تتحول لـ demon لكن كان لديها إنسانيتها", answer: "نيزكو" },
        { description: "شخصية من Death Note، رقم 1، ملك الشياطين الذي لديه دفتر ملاحظات يقتل", answer: "لايت" },
        { description: "شخصية من Naruto، ينسخ جميع التقنيات، ليس له أصدقاء في الأساس", answer: "كاكاشي" },
        { description: "شخصية من Code Geass، لديه قوة سحرية تدعى Geass، يرتدي قناعاً", answer: "ليلوش" },
        { description: "شخصية من Steins;Gate، عالم مجنون يرتدي معطف أبيض", answer: "أوكابي" },
        { description: "شخصية من Darling in the Franxx، لديها قرون زرقاء، تحب حياة الإنسان", answer: "زيرو_توو" },
        { description: "شخصية من Jujutsu Kaisen، لديه 10 أصابع لشيطان قوي بداخله", answer: "يوجي" },
        { description: "شخصية من Fate Series، يرتدي معطف أحمر، سيف ذهبي", answer: "جيلجامش" },
        { description: "شخصية من Bleach، قطة بيضاء تمشي على أرجل، تحب التحولات", answer: "يوروتشي" },
        { description: "شخصية من Mob Psycho 100، ساحر بقدرات نفسية خاصة، هادئ وخجول", answer: "موب" }
      ];

      const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
      const correctAnswer = randomQuestion.answer.toLowerCase();

      api.setMessageReaction("🎭", event.messageID, (err) => {}, true);

      const message = `🎭 حزر اسم الشخصية:\n\n"${randomQuestion.description}"\n\n💡 رد على هذه الرسالة باسم الشخصية`;

      api.sendMessage(message, event.threadID, (error, info) => {
        if (!error) {
          if (!global.client?.handler?.reply) {
            if (!global.client) global.client = {};
            if (!global.client.handler) global.client.handler = {};
            global.client.handler.reply = new Map();
          }

          global.client.handler.reply.set(info.messageID, {
            name: this.name,
            correctAnswer: correctAnswer,
            type: "characters_guess",
            messageID: info.messageID
          });

          setTimeout(() => {
            try {
              global.client.handler.reply.delete(info.messageID);
            } catch (e) {}
          }, 60000);
        }
        
        api.setMessageReaction("✅", event.messageID, (err) => {}, true);
      }, event.messageID);

    } catch (error) {
      console.error("[CHARACTERS] خطأ:", error);
      api.setMessageReaction("❌", event.messageID, (err) => {}, true);
      api.sendMessage("❌ حدث خطأ في الأمر", event.threadID, event.messageID);
    }
  }

  async onReply({ api, event, reply }) {
    try {
      if (reply && reply.type === "characters_guess" && reply.name === "تخمين") {
        const userAnswer = event.body.trim().toLowerCase();
        const correctAnswer = reply.correctAnswer.toLowerCase();

        if (userAnswer === correctAnswer) {
          api.setMessageReaction("✅", event.messageID, (err) => {}, true);
          api.sendMessage(`✅ تهانينا! 🎉 الإجابة صحيحة!`, event.threadID, event.messageID);
          
          try {
            api.unsendMessage(reply.messageID);
          } catch (e) {}
        } else {
          api.setMessageReaction("❌", event.messageID, (err) => {}, true);
          api.sendMessage(`❌ خطأ! الإجابة الصحيحة: ${reply.correctAnswer}`, event.threadID, event.messageID);
        }
      }
    } catch (error) {
      console.error("[CHARACTERS] خطأ في onReply:", error);
    }
  }
}

export default new CharactersGuessCommand();
