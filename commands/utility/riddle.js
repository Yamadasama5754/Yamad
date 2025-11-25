const riddles = [
  {
    question: "ما الشيء الذي له وجه وليس له عيون؟",
    answers: ["ساعة", "ساعه", "watch", "clock"],
    hint: "شيء تستخدمه لمعرفة الوقت"
  },
  {
    question: "ما الشيء الذي كلما أخذت منه أكبر؟",
    answers: ["حفرة", "حفره", "hole"],
    hint: "شيء في الأرض"
  },
  {
    question: "ما الذي لا يمكنك أكله في اليوم الأول من السنة؟",
    answers: ["يوم الثاني", "اليوم الثاني", "الثاني", "الايام"],
    hint: "تاريخي شيء"
  },
  {
    question: "أنا أسود عندما أكون نظيفة وبيضاء عندما أكون قذرة، من أكون؟",
    answers: ["لوحة", "سبورة", "blackboard"],
    hint: "تستخدمها في الدراسة"
  },
  {
    question: "أربع أرجل ولا تركض، ما هو؟",
    answers: ["كرسي", "كرسى", "table", "طاولة"],
    hint: "أثاث"
  },
  {
    question: "ما الذي يصعد بدون أرجل ويسقط بدون جناح؟",
    answers: ["مطر", "ماء", "water", "rain"],
    hint: "من السماء"
  },
  {
    question: "كم عدد الأشهر التي فيها 28 يوماً؟",
    answers: ["12", "كل الأشهر", "جميع", "all"],
    hint: "كلها!"
  },
  {
    question: "ما هو الشيء الذي يسير لكن لا يمشي؟",
    answers: ["ساعة", "ساعه", "ساعات", "watch"],
    hint: "يحتوي على عقارب"
  }
];

class Riddle {
  constructor() {
    this.name = "لغز";
    this.author = "Yamada KJ & Alastor";
    this.description = "لعبة الألغاز - خمّن الإجابة الصحيحة!";
    this.aliases = ["riddle", "الغاز", "puzzle"];
    this.role = 0;
    this.cooldowns = 5;
  }

  getRandomRiddle() {
    return riddles[Math.floor(Math.random() * riddles.length)];
  }

  async execute({ api, event }) {
    try {
      api.setMessageReaction("🧩", event.messageID, (err) => {}, true);

      const riddle = this.getRandomRiddle();

      let msg = `🧩 لعبة الألغاز!\n\n`;
      msg += `❓ السؤال:\n${riddle.question}\n\n`;
      msg += `💡 تلميح: ${riddle.hint}\n\n`;
      msg += `📝 أرد على الرسالة بالإجابة!`;

      api.sendMessage(msg, event.threadID, (err, info) => {
        if (err) return;
        global.client.handler.reply.set(info.messageID, {
          name: this.name,
          messageID: info.messageID,
          riddle: riddle,
          author: event.senderID,
          attempts: 0
        });
      });

      api.setMessageReaction("✅", event.messageID, (err) => {}, true);

    } catch (err) {
      console.error("❌ خطأ في لغز:", err);
      return api.sendMessage("❌ حدث خطأ في اللعبة", event.threadID);
    }
  }

  async onReply({ api, event, reply }) {
    try {
      const { author, riddle } = reply;
      if (author !== event.senderID) return;

      const answer = event.body.trim().toLowerCase();
      const isCorrect = riddle.answers.some(a => a.toLowerCase() === answer);

      if (isCorrect) {
        api.setMessageReaction("✅", event.messageID, (err) => {}, true);
        let msg = `🎉 صحيح!\n\n`;
        msg += `✨ الإجابة الصحيحة: ${riddle.answers[0]}\n`;
        msg += `🏆 ممتاز! أنت ذكي جداً!`;
        api.sendMessage(msg, event.threadID);
      } else {
        api.setMessageReaction("❌", event.messageID, (err) => {}, true);
        let msg = `❌ خطأ!\n\n`;
        msg += `الإجابة الصحيحة: ${riddle.answers[0]}\n`;
        msg += `🧩 حاول لغز آخر!`;
        api.sendMessage(msg, event.threadID);
      }

    } catch (err) {
      console.error("❌ خطأ في الرد:", err);
      api.sendMessage("❌ حدث خطأ", event.threadID);
    }
  }
}

export default new Riddle();
