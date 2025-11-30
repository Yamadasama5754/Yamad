class TajmeeCommand {
  constructor() {
    this.name = "تجميع";
    this.author = "عبدالرحمن & محسّن";
    this.cooldowns = 5;
    this.description = "لعبة تجميع الكلمة 🔤";
    this.role = 0;
    this.aliases = ["تجميع_كلمة", "tajmee", "جمع"];
  }

  getWords() {
    return [
      { question: "ا ل ظ ل ا م", answer: "الظلام" },
      { question: "ا ل س ع ا د ة", answer: "السعادة" },
      { question: "ا ل ث ر و ة", answer: "الثروة" },
      { question: "ا ل ح ر ا ر ة", answer: "الحرارة" },
      { question: "ا ل ر ط و ب ة", answer: "الرطوبة" },
      { question: "ا ل ض و ض ا ء", answer: "الضوضاء" },
      { question: "ا ل م و ت", answer: "الموت" },
      { question: "ا ل ن ه ا ي ة", answer: "النهاية" },
      { question: "ا ل أ د ن ى", answer: "الأدنى" },
      { question: "ا ل خ ا ر ج", answer: "الخارج" },
      { question: "ا ل خ ل ف", answer: "الخلف" },
      { question: "ا ل ي س ا ر", answer: "اليسار" },
      { question: "ا ل ب ع ي د", answer: "البعيد" },
      { question: "ا ل ص ع ب", answer: "الصعب" },
      { question: "ا ل ق ا س ي", answer: "القاسي" },
      { question: "ا ل ح ز ن", answer: "الحزن" },
      { question: "ا ل ك ر ا ه ي ة", answer: "الكراهية" },
      { question: "ا ل ع ص ب ي ة", answer: "العصبية" },
      { question: "ا ل ح ق ي ق ة", answer: "الحقيقة" },
      { question: "ا ل م ا ض ي", answer: "الماضي" },
      { question: "ا ل ح ا ض ر", answer: "الحاضر" },
      { question: "ا ل م ز ي ف", answer: "المزيف" },
      { question: "ا ل خ ط أ", answer: "الخطأ" },
      { question: "ا ل س ي ئ", answer: "السيئ" },
      { question: "ا ل ق ب ي ح", answer: "القبيح" },
      { question: "ا ل ف ق ي ر", answer: "الفقير" },
      { question: "ا ل ض ع ي ف", answer: "الضعيف" },
      { question: "ا ل خ ا ئ ن", answer: "الخائن" },
      { question: "ا ل أ ن ث ى", answer: "الأنثى" },
      { question: "ا ل ا ن ا ث", answer: "الاناث" },
      { question: "ا ل ج م ي ع", answer: "الجمع" },
      { question: "ا ل م ؤ ن ث", answer: "المؤنث" },
      { question: "ا ل س ل ب ي", answer: "السلبي" },
      { question: "ا ل م ل ل", answer: "الملل" },
      { question: "ا ك ر ه ك", answer: "اكرهك" },
      { question: "ت ح ب ن ي", answer: "تحبني" },
      { question: "ا ل ك ب ر ى", answer: "الكبرى" },
      { question: "ا ل ك ث ر ة", answer: "الكثرة" },
      { question: "ا ل ص ع و ب ة", answer: "الصعوبة" },
      { question: "ا ل ق س و ة", answer: "القسوة" },
      { question: "ا ل ا ي م ا ن", answer: "الايمان" },
      { question: "ا ل ي أ س", answer: "اليأس" },
      { question: "ا ل غ ي ب و ب ة", answer: "الغيبوبة" },
      { question: "ا ل ن و م", answer: "النوم" },
      { question: "ا ل ك ذ ب", answer: "الكذب" },
      { question: "ا ل ظ ل م", answer: "الظلم" },
      { question: "ا ل ش ر", answer: "الشر" },
      { question: "ا ل ق ب ح", answer: "القبح" },
      { question: "ا ل ن ق ص", answer: "النقص" }
    ];
  }

  async execute({ api, event, Currencies, Users }) {
    try {
      api.setMessageReaction("🔤", event.messageID, (err) => {}, true);

      const words = this.getWords();
      const randomWord = words[Math.floor(Math.random() * words.length)];
      const correctAnswer = randomWord.answer.toLowerCase().replace(/\s+/g, "");

      let message = `🔤 لعبة تجميع الكلمة 🔤\n`;
      message += `════════════════════\n\n`;
      message += `❓ جمع الأحرف: ${randomWord.question}\n\n`;
      message += `💡 عدد الأحرف: ${randomWord.answer.split(" ").length} أحرف\n\n`;
      message += `📝 ارد على هذه الرسالة بالكلمة المجمعة\n`;
      message += `(بدون مسافات)\n\n`;
      message += `🏆 الجائزة: 20 دولار`;

      api.setMessageReaction("✅", event.messageID, (err) => {}, true);
      
      api.sendMessage(message, event.threadID, (error, info) => {
        if (!error && info) {
          global.client.handler.reply.set(info.messageID, {
            name: this.name,
            author: this.author,
            correctAnswer: correctAnswer,
            word: randomWord.answer,
            messageID: info.messageID
          });
        }
      });

    } catch (error) {
      console.error("[TAJMEE] خطأ:", error);
      api.setMessageReaction("❌", event.messageID, (err) => {}, true);
      api.sendMessage("❌ حدث خطأ: " + error.message, event.threadID, event.messageID);
    }
  }

  async onReply({ api, event, reply, Currencies, Users }) {
    try {
      const userAnswer = event.body.trim().toLowerCase().replace(/\s+/g, "");
      const correctAnswer = reply.correctAnswer.toLowerCase();

      let userName = "لاعب";
      try {
        const userInfo = await api.getUserInfo(event.senderID);
        userName = userInfo[event.senderID]?.name || "لاعب";
      } catch (e) {
        console.warn("[TAJMEE] تعذر الحصول على اسم المستخدم");
      }

      if (userAnswer === correctAnswer) {
        api.setMessageReaction("✅", event.messageID, (err) => {}, true);
        
        // إضافة جائزة
        try {
          await Currencies.increaseMoney(event.senderID, 20);
        } catch (err) {
          console.warn("[TAJMEE] خطأ في إضافة الجائزة:", err);
        }

        let winMsg = `🎉 تهانينا يا ${userName}! 🎉\n`;
        winMsg += `════════════════════\n`;
        winMsg += `✅ الإجابة صحيحة!\n\n`;
        winMsg += `🔤 الكلمة: ${reply.word}\n\n`;
        winMsg += `💰 كسبت 20 دولار!\n`;
        winMsg += `════════════════════`;
        
        api.sendMessage(winMsg, event.threadID);
      } else {
        api.setMessageReaction("❌", event.messageID, (err) => {}, true);
        
        let loseMsg = `❌ خطأ يا ${userName}! ❌\n`;
        loseMsg += `════════════════════\n`;
        loseMsg += `🔤 الإجابة الصحيحة: ${reply.word}\n\n`;
        loseMsg += `💭 حاول مرة أخرى!\n`;
        loseMsg += `════════════════════`;
        
        api.sendMessage(loseMsg, event.threadID);
      }

    } catch (error) {
      console.error("[TAJMEE] خطأ في onReply:", error);
      api.sendMessage("❌ حدث خطأ: " + error.message, event.threadID, event.messageID);
    }
  }
}

export default new TajmeeCommand();
