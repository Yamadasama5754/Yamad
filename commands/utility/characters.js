class CharactersCommand {
  constructor() {
    this.name = "تخمين";
    this.author = "KAGUYA PROJECT";
    this.cooldowns = 5;
    this.description = "تخمين اسم شخصيات الأنمي 🎲";
    this.role = 0;
    this.aliases = ["تخمين", "شخصية", "غيس"];
  }

  async onLoad() {
    console.log("[CHARACTERS] تم تحضير أمر تخمين الشخصيات بنجاح");
  }

  async execute({ api, event }) {
    try {
      const characters = [
        { answer: "اوبيتو", description: "شخصية من Naruto، قناع أسود، قوة الزمان والمكان" },
        { answer: "اوروتشيمارو", description: "شخصية من Naruto، عالم الجراحة السوداء، طويل الذراعين" },
        { answer: "اوسوب", description: "شخصية من One Piece، الكاذب الذي أصبح محارب، قناص ماهر" },
        { answer: "اوكيجي", description: "شخصية من One Piece، بحار سابق، يتحكم بالثلج والجليد" },
        { answer: "ايرين", description: "شخصية من Attack on Titan، تحول إلى عملاق، تخطيط ذكي" },
        { answer: "ايتاشي", description: "شخصية من Naruto، مكحول سوداء، قتل عشيرته" },
        { answer: "ايتشيغو", description: "شخصية من Bleach، بطل الأنمي، يرى الأرواح" },
        { answer: "ميدوريا", description: "شخصية من My Hero Academia، بطل المدرسة، أخضر الشعر" },
        { answer: "انيل", description: "شخصية من One Piece، إله سماوي، يتحكم بالكهرباء" },
        { answer: "بارتولوميو", description: "شخصية من One Piece، حاجز شفاف، معجب بلوفي" },
        { answer: "بروك", description: "شخصية من One Piece، هيكل عظمي يغني، عازف موسيقار" },
        { answer: "بوروتو", description: "شخصية من Boruto، ابن ناروتو، بطل جديد" },
        { answer: "بيكولا", description: "شخصية من Dragon Ball، تنين قاهر، ملك الأكوان" },
        { answer: "ترافاجار دي لاو", description: "شخصية من One Piece، عملية تقطيع، قبطان متحالف" },
        { answer: "ترانكس", description: "شخصية من Dragon Ball، السفر عبر الزمن، شعر أزرق" },
        { answer: "جيرايا", description: "شخصية من Naruto، ساحر الضفادع، معلم ناروتو" },
        { answer: "لوفي", description: "شخصية من One Piece، ملك القراصنة، يحب اللحم" },
        { answer: "دورايمون", description: "شخصية من Doraemon، ربوت أزرق، يسافر عبر الزمن" },
        { answer: "دوفلامينغو", description: "شخصية من One Piece، خيوط حمراء، إمبراطور الكوليسيوم" },
        { answer: "زورو", description: "شخصية من One Piece، ثلاث سيوف، أخضر الشعر" },
        { answer: "سابو", description: "شخصية من One Piece، يستخدم النار السوداء" },
        { answer: "سانجي", description: "شخصية من One Piece، رجل ساحر، طاهي السفينة" },
        { answer: "غوكو", description: "شخصية من Dragon Ball، أقوى محارب، شعر أسود شائك" },
        { answer: "كونان", description: "شخصية من Detective Conan، محقق صغير، عبقري" },
        { answer: "غارا", description: "شخصية من Naruto، يتحكم بالرمل، جنو أحمر الشعر" },
        { answer: "كابتن كورو", description: "شخصية من One Piece، قاتل محترف، سلاح المخالب" },
        { answer: "كايتو كيد", description: "شخصية من Detective Conan، لص سماوي، متخفي" },
        { answer: "كوبي", description: "شخصية من One Piece، بحار شاب، تلميذ لوفي" },
        { answer: "ياغامي لايت", description: "شخصية من Death Note، كتاب الموت، ملك الشياطين" },
        { answer: "ليفاي", description: "شخصية من Attack on Titan، فيلق استطلاع، قصير البنية" },
        { answer: "ماركو", description: "شخصية من One Piece، فينيكس الأسطورية، قبطان سابق" },
        { answer: "مادارا", description: "شخصية من Naruto، أسطورة، قوة مطلقة لا تقهر" },
        { answer: "ميكاسا", description: "شخصية من Attack on Titan، شعر أسود، مخلصة جداً" },
        { answer: "نيزكو", description: "شخصية من Demon Slayer، وحش بإنسانية، أخت تانجيرو" }
      ];

      const randomCharacter = characters[Math.floor(Math.random() * characters.length)];
      const correctAnswer = randomCharacter.answer.toLowerCase();

      api.setMessageReaction("🎲", event.messageID, (err) => {}, true);

      const message = `🎲 خمن اسم الشخصية:\n\n"${randomCharacter.description}"\n\n💡 رد على هذه الرسالة باسم الشخصية`;

      api.sendMessage(
        message,
        event.threadID,
        (error, info) => {
          if (!error) {
            if (!global.client?.handler?.reply) {
              if (!global.client) global.client = {};
              if (!global.client.handler) global.client.handler = {};
              global.client.handler.reply = new Map();
            }

            global.client.handler.reply.set(info.messageID, {
              name: this.name,
              correctAnswer: correctAnswer,
              type: "characters"
            });

            setTimeout(() => {
              try {
                global.client.handler.reply.delete(info.messageID);
              } catch (e) {}
            }, 60000);
          } else {
            console.error("[CHARACTERS] خطأ في إرسال الرسالة:", error);
          }
        },
        event.messageID
      );
    } catch (error) {
      console.error("[CHARACTERS] خطأ في تنفيذ الأمر:", error);
      api.sendMessage("❌ حدث خطأ في الأمر.", event.threadID, event.messageID);
    }
  }

  async onReply({ api, event, reply }) {
    try {
      if (reply && reply.type === "characters" && reply.name === "تخمين") {
        const userAnswer = event.body.trim().toLowerCase();
        const correctAnswer = reply.correctAnswer.toLowerCase();

        const userInfo = await api.getUserInfo(event.senderID);
        const userName = userInfo ? userInfo[event.senderID].name : "المستخدم";

        if (correctAnswer.split(" ").some(part => userAnswer.includes(part))) {
          api.setMessageReaction("✅", event.messageID, (err) => {}, true);

          let successMessage = `◆❯━━━━━▣✦▣━━━━━━❮◆\n✅ | تهانينا يا ${userName} 🥳\n🎯 | الجواب: ${correctAnswer}\n◆❯━━━━━▣✦▣━━━━━━❮◆`;

          api.sendMessage(successMessage, event.threadID, event.messageID);
        } else {
          api.setMessageReaction("❌", event.messageID, (err) => {}, true);
          api.sendMessage(
            `❌ | آسف، الإجابة خاطئة. حاول مرة أخرى!`,
            event.threadID,
            event.messageID
          );
        }
      }
    } catch (error) {
      console.error("[CHARACTERS] خطأ في onReply:", error);
    }
  }
}

export default new CharactersCommand();
