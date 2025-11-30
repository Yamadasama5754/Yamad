class TakfikCommand {
  constructor() {
    this.name = "تفكيك";
    this.author = "عبدالرحمن & محسّن";
    this.cooldowns = 5;
    this.description = "لعبة تفكيك الكلمة 🔤";
    this.role = 0;
    this.aliases = ["تفكيك_كلمة", "takfik", "فكك"];
  }

  getWords() {
    return [
      { question: "بيت", answer: "ب ي ت" },
      { question: "رجل", answer: "ر ج ل" },
      { question: "امرأة", answer: "ا م ر أ ة" },
      { question: "ولد", answer: "و ل د" },
      { question: "فتاة", answer: "ف ت ا ة" },
      { question: "ماء", answer: "م ا ء" },
      { question: "نار", answer: "ن ا ر" },
      { question: "شمس", answer: "ش م س" },
      { question: "قمر", answer: "ق م ر" },
      { question: "ليل", answer: "ل ي ل" },
      { question: "نهار", answer: "ن ه ا ر" },
      { question: "جبل", answer: "ج ب ل" },
      { question: "سهل", answer: "س ه ل" },
      { question: "شجرة", answer: "ش ج ر ة" },
      { question: "زهرة", answer: "ز ه ر ة" },
      { question: "طير", answer: "ط ي ر" },
      { question: "أسد", answer: "أ س د" },
      { question: "ذئب", answer: "ذ ئ ب" },
      { question: "جمل", answer: "ج م ل" },
      { question: "بقر", answer: "ب ق ر" },
      { question: "غنم", answer: "غ ن م" },
      { question: "كتاب", answer: "ك ت ا ب" },
      { question: "قلم", answer: "ق ل م" },
      { question: "ورقة", answer: "و ر ق ة" },
      { question: "منزل", answer: "م ن ز ل" },
      { question: "مدرسة", answer: "م د ر س ة" },
      { question: "مستشفى", answer: "م س ت ش ف ى" },
      { question: "متجر", answer: "م ت ج ر" },
      { question: "مطعم", answer: "م ط ع م" },
      { question: "سيارة", answer: "س ي أ ر ة" },
      { question: "دراجة", answer: "د ر ا ج ة" },
      { question: "طائرة", answer: "ط ا ئ ر ة" },
      { question: "قطار", answer: "ق ط ا ر" },
      { question: "سفينة", answer: "س ف ي ن ة" }
    ];
  }

  sanitizeName(name) {
    if (!name || typeof name !== 'string') return 'لاعب';
    
    // إزالة الأحرف الغريبة والرموز غير العربية
    const cleanName = name
      .replace(/[^\u0600-\u06FF\u0020-\u007E]/g, '')
      .trim();
    
    return cleanName || 'لاعب';
  }

  normalizeAnswer(text) {
    if (!text) return '';
    
    // إزالة المسافات الزائدة والمسافات الفارغة
    return text
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[^\u0600-\u06FF]/g, '');
  }

  async execute({ api, event }) {
    try {
      api.setMessageReaction("🔤", event.messageID, (err) => {}, true);

      const words = this.getWords();
      const randomWord = words[Math.floor(Math.random() * words.length)];
      const correctAnswerWithSpaces = randomWord.answer.toLowerCase();
      const correctAnswerNoSpaces = this.normalizeAnswer(correctAnswerWithSpaces);

      let message = `🔤 لعبة تفكيك الكلمة 🔤\n`;
      message += `════════════════════\n\n`;
      message += `❓ فكك كلمة: ${randomWord.question}\n\n`;
      message += `📝 ارد على هذه الرسالة بالأحرف المفككة`;

      api.setMessageReaction("✅", event.messageID, (err) => {}, true);
      
      api.sendMessage(message, event.threadID, (error, info) => {
        if (!error && info) {
          global.client.handler.reply.set(info.messageID, {
            name: this.name,
            author: this.author,
            correctAnswerWithSpaces: correctAnswerWithSpaces,
            correctAnswerNoSpaces: correctAnswerNoSpaces,
            word: randomWord.question,
            messageID: info.messageID,
            author_id: event.senderID
          });
        }
      });

    } catch (error) {
      console.error("[TAKFIK] خطأ:", error);
      api.setMessageReaction("❌", event.messageID, (err) => {}, true);
      api.sendMessage("❌ حدث خطأ: " + error.message, event.threadID, event.messageID);
    }
  }

  async onReply({ api, event, reply }) {
    try {
      // تحقق من أن الشخص المردود عليه هو صاحب اللعبة فقط
      if (reply.author_id && event.senderID !== reply.author_id) {
        api.setMessageReaction("🚫", event.messageID, (err) => {}, true);
        return api.sendMessage(
          "🚫 فقط صاحب اللعبة يقدر يجاوب!",
          event.threadID,
          event.messageID
        );
      }

      const userAnswer = this.normalizeAnswer(event.body);
      const correctAnswerNoSpaces = this.normalizeAnswer(reply.correctAnswerNoSpaces);

      let userName = "لاعب";
      try {
        const userInfo = await api.getUserInfo(event.senderID);
        userName = this.sanitizeName(userInfo[event.senderID]?.name);
      } catch (e) {
        console.warn("[TAKFIK] تعذر الحصول على اسم المستخدم");
      }

      if (userAnswer === correctAnswerNoSpaces) {
        api.setMessageReaction("✅", event.messageID, (err) => {}, true);

        let winMsg = `🎉 تهانينا يا ${userName}! 🎉\n`;
        winMsg += `════════════════════\n`;
        winMsg += `✅ الإجابة صحيحة!\n\n`;
        winMsg += `🔤 الكلمة: ${reply.word}\n`;
        winMsg += `════════════════════`;
        
        api.sendMessage(winMsg, event.threadID);
      } else {
        api.setMessageReaction("❌", event.messageID, (err) => {}, true);
        
        let loseMsg = `❌ خطأ يا ${userName}! ❌\n`;
        loseMsg += `════════════════════\n`;
        loseMsg += `🔤 الكلمة: ${reply.word}\n`;
        loseMsg += `✅ الإجابة الصحيحة: ${reply.correctAnswerWithSpaces}\n`;
        loseMsg += `════════════════════`;
        
        api.sendMessage(loseMsg, event.threadID);
      }

    } catch (error) {
      console.error("[TAKFIK] خطأ في onReply:", error);
      api.sendMessage("❌ حدث خطأ: " + error.message, event.threadID, event.messageID);
    }
  }
}

export default new TakfikCommand();
