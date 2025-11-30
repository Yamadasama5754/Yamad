class TajmeeCommand {
    constructor() {
        this.name = "تجميع";
        this.version = "1.0.0";
        this.hasPermssion = 0;
        this.credits = "عبدالرحمن";
        this.description = "لعبة تجميع الأحرف ";
        this.usages = ["لعبة"];
        this.commandCategory = "العاب";
        this.cooldowns = 0;
    }

    getQuestions() {
        return [
            { word: "بيت", scattered: "ب ي ت" },
            { word: "رجل", scattered: "ر ج ل" },
            { word: "امرأة", scattered: "ا م ر أ ة" },
            { word: "ولد", scattered: "و ل د" },
            { word: "فتاة", scattered: "ف ت ا ة" },
            { word: "ماء", scattered: "م ا ء" },
            { word: "نار", scattered: "ن ا ر" },
            { word: "شمس", scattered: "ش م س" },
            { word: "قمر", scattered: "ق م ر" },
            { word: "ليل", scattered: "ل ي ل" },
            { word: "نهار", scattered: "ن ه ا ر" },
            { word: "جبل", scattered: "ج ب ل" },
            { word: "سهل", scattered: "س ه ل" },
            { word: "شجرة", scattered: "ش ج ر ة" },
            { word: "زهرة", scattered: "ز ه ر ة" },
            { word: "طير", scattered: "ط ي ر" },
            { word: "أسد", scattered: "أ س د" },
            { word: "ذئب", scattered: "ذ ئ ب" },
            { word: "جمل", scattered: "ج م ل" },
            { word: "بقر", scattered: "ب ق ر" },
            { word: "غنم", scattered: "غ ن م" },
            { word: "كتاب", scattered: "ك ت ا ب" },
            { word: "قلم", scattered: "ق ل م" },
            { word: "ورقة", scattered: "و ر ق ة" },
            { word: "منزل", scattered: "م ن ز ل" },
            { word: "مدرسة", scattered: "م د ر س ة" },
            { word: "مستشفى", scattered: "م س ت ش ف ى" },
            { word: "متجر", scattered: "م ت ج ر" },
            { word: "مطعم", scattered: "م ط ع م" },
            { word: "سيارة", scattered: "س ي أ ر ة" },
            { word: "دراجة", scattered: "د ر ا ج ة" },
            { word: "طائرة", scattered: "ط ا ئ ر ة" },
            { word: "قطار", scattered: "ق ط ا ر" },
            { word: "سفينة", scattered: "س ف ي ن ة" }
        ];
    }

    async execute({ api, event, args, Currencies, Users }) {
        try {
            const questions = this.getQuestions();
            const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
            const correctAnswer = randomQuestion.word;
            const scatteredLetters = randomQuestion.scattered;

            const message = `اسرع شخص يجمع الأحرف: ${scatteredLetters}`;

            api.sendMessage({ body: message }, event.threadID, (error, info) => {
                if (!error) {
                    if (!global.client.handleReply) {
                        global.client.handleReply = [];
                    }
                    global.client.handleReply.push({
                        name: this.name,
                        messageID: info.messageID,
                        correctAnswer: correctAnswer
                    });
                }
            });
        } catch (error) {
            console.error("[TAJMEE] خطأ:", error);
            api.sendMessage("❌ حدث خطأ: " + error.message, event.threadID, event.messageID);
        }
    }

    async handleReply({ api, event, handleReply, Currencies, Users }) {
        try {
            const userAnswer = event.body.trim().toLowerCase();
            const correctAnswer = handleReply.correctAnswer.toLowerCase();
            const userName = global.data.userName.get(event.senderID) || await Users.getNameUser(event.senderID);

            if (userAnswer === correctAnswer) {
                Currencies.increaseMoney(event.senderID, 50);
                api.sendMessage(`تهانينا ${userName} انت الاسرع وكسبت 50 دولار`, event.threadID);
                api.unsendMessage(handleReply.messageID);
            } else {
                api.sendMessage(`خطأ حاول مره اخرا`, event.threadID);
            }
        } catch (error) {
            console.error("[TAJMEE] خطأ في handleReply:", error);
        }
    }
}

export default new TajmeeCommand();
