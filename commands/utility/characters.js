import fs from "fs";
import path from "path";
import axios from "axios";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const userDataFile = path.join(__dirname, "cache", "pontsData.json");
const tempImageFilePath = path.join(__dirname, "cache", "characters.jpg");

// Ensure the existence of directories and user data file
const cacheDir = path.join(__dirname, "cache");
if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir, { recursive: true });
}

if (!fs.existsSync(userDataFile)) {
  fs.writeFileSync(userDataFile, '{}');
}

class CharactersCommand {
  constructor() {
    this.name = "تخمين";
    this.author = "KAGUYA PROJECT";
    this.cooldowns = 5;
    this.description = "تخمين اسم شخصيات الأنمي من خلال الوصف والفوز بالنقاط 🎲";
    this.role = 0;
    this.aliases = ["تخمين", "شخصية", "غيس"];
  }

  async onLoad() {
    console.log("[CHARACTERS] تم تحضير أمر تخمين الشخصيات بنجاح");
  }

  async execute({ api, event }) {
    try {
      const questions = [
        { 
          question: "شخصية خيالية في انمي ناروتو، كان يعتقد أنّه قد لقى حتفه خلال حرب النينجا العظمى الثالثة، ينتمي لعشيرة الأوتشيها وفي لحظاته الأخيرة أعطى لزميله في الفريق كاكاشي هاتاكي عين الشارينغان كهدية لترقيته لرتبة جونين", 
          answer: "اوبيتو", 
          image: "https://i.imgur.com/zG4ehpe.png" 
        },
        { 
          question: "شخص شرير ويسعى إلى الخلود الأبدي من خلال التقنيات المحظورة التي قام بتطويرها، اكتشفه ساروتوبي الهوكاجي الثالث وأستاذه", 
          answer: "اوروتشيمارو", 
          image: "https://i.imgur.com/qQK7r3E.jpeg" 
        },
        { 
          question: "شخصية خيالية من تأليف إييتشيرو أودا. هو قناص طاقم قبعة القش وحلمه أن يصبح رجل البحر الأول", 
          answer: "اوسوب", 
          image: "https://i.imgur.com/HkJ5D24.png" 
        },
        { 
          question: "أحد شخصيات أنمي ون بيس، و هو الأدميرال السابق للبحرية و أول الادمرالات ظهوراً", 
          answer: "اوكيجي", 
          image: "https://i.imgur.com/febnZ0y.jpeg" 
        },
        { 
          question: "شخصية خيالية، والبطل الرئيسي في سلسلة هجوم العمالقة. ينحدر من بلدة شيغانشينا", 
          answer: "ايرين", 
          image: "https://i.imgur.com/gAHKduw.png" 
        },
        { 
          question: "أحد شخصيات عالم النينجا الخيالي الذي ابتكره ماساشي كيشيموتو. هو الأخ الأكبر لساسكي", 
          answer: "ايتاشي", 
          image: "https://i.imgur.com/uP01IFu.jpeg" 
        },
        { 
          question: "شخصية خيالية من مانغا وانمي بليتش. هو الشخصية الأساسية في القصة", 
          answer: "ايتشيغو", 
          image: "https://i.imgur.com/3ImTGnT.png" 
        },
        { 
          question: "شخصية معروفة باسم ديكو، هو بطل خارق والبطل الرئيسي لسلسلة المانجا أكاديميتي للأبطال", 
          answer: "ميدوريا", 
          image: "https://i.imgur.com/zAP7sPD.png" 
        },
        { 
          question: "شخصية من أنمي ون بيس ظهر في الحلقة 167 في ارك سكايبيا ولديه مكافئة 500,000,000 بيلي", 
          answer: "انيل", 
          image: "https://i.imgur.com/eMswF26.jpeg" 
        },
        { 
          question: "أحد شخصيات أنمي ومانغاون بيس، والمعروف ببارتولوميو آكل لحوم البشر، وهو صديق لقبعة القش", 
          answer: "بارتولوميو", 
          image: "https://i.imgur.com/aR0DAZz.png" 
        },
        { 
          question: "موسيقار طاقم قبعة القش، عبارة عن هيكل عظمي طويل القامة", 
          answer: "بروك", 
          image: "https://i.imgur.com/v0j9d3s.jpeg" 
        },
        { 
          question: "شخصية خيالية رئيسية في سلسلة ناروتو، ابن بطل الرواية ناروتو أوزوماكي", 
          answer: "بوروتو", 
          image: "https://i.imgur.com/q58bBoG.jpeg" 
        },
        { 
          question: "شخصية خيالية من الأنمي الياباني دراغون بول، ذكاء شديد وقوة متوسطة", 
          answer: "بيكولا", 
          image: "https://i.imgur.com/yQCm3HI.png" 
        },
        { 
          question: "شخصية من سلسلة ون بيس يمثل قبطان وطبيب طاقم قراصنة القلب", 
          answer: "ترافاجار دي لاو", 
          image: "https://i.imgur.com/pbDipVq.jpeg" 
        },
        { 
          question: "محارب هجين نصف ساياجين ونصف أرضي والده فيجيتا", 
          answer: "ترانكس", 
          image: "https://i.imgur.com/4b25jQP.jpeg"
        },
        { 
          question: "شخصية خيالية في سلسلة مانغا وأنمي ناروتو، تلميذًا للشهاب الثالث هيروزين ساروتوبي", 
          answer: "جيرايا", 
          image: "https://i.imgur.com/OluJyts.png" 
        },
        { 
          question: "بطل مسلسل ونبيس كان قد اكل فاكهة جومو جومو فاكهة المطاط", 
          answer: "لوفي", 
          image: "https://i.imgur.com/jAJSd7r.jpeg" 
        },
        { 
          question: "قط آليٌ من القرن الثاني والعشرين يسافر عبر الزمن إلى الماضي", 
          answer: "دورايمون", 
          image: "https://i.imgur.com/xFoxuOT.png" 
        },
        { 
          question: "كابتن قراصنة دون كيهوتي، أحد التشيبوكاي السبعة سابقا", 
          answer: "دوفلامينغو", 
          image: "https://i.imgur.com/FazFYLr.png" 
        },
        { 
          question: "أول من انضم إلى لوفي، سياف طاقم قبعة القش", 
          answer: "زورو", 
          image: "https://i.imgur.com/2kY8hov.png" 
        },
        { 
          question: "انضم سابو إلى الجيش الثوري تحت قيادة مونكي دي دراجون", 
          answer: "سابو", 
          image: "https://i.imgur.com/fjJ5ElD.jpeg" 
        },
        { 
          question: "قرصان من قراصنة قبعة القش وهو رابع عضو انضم للطاقم", 
          answer: "سانجي", 
          image: "https://i.imgur.com/kKFx3j1.jpeg" 
        },
        { 
          question: "بطل سلسلة أنمي ومانغا دراغون بول، يُلقب بالأب الروحي للأنميات", 
          answer: "غوكو", 
          image: "https://i.imgur.com/LnOKuOx.png" 
        },
        { 
          question: "محقق الثانوية يساعد الشرطة في حل القضايا والعثور على المجرمين", 
          answer: "كونان", 
          image: "https://i.imgur.com/5ymjg5R.jpeg" 
        },
        { 
          question: "شخصية من شخصيات ناروتو كان أول ظهور له في الحلقة 26", 
          answer: "غارا", 
          image: "https://i.imgur.com/yUCd3D6.png" 
        },
        { 
          question: "كابتن قراصنة القطة السوداء قبل أن يعتزل القرصنة", 
          answer: "كابتن كورو", 
          image: "https://i.imgur.com/aZWvR7q.jpeg" 
        },
        { 
          question: "شخصية خيالية من شخصيات ماجك كايتو، اللص الطائر", 
          answer: "كايتو كيد", 
          image: "https://i.imgur.com/6ckK6nT.jpeg" 
        },
        { 
          question: "شخصية خيالية في مسلسل أنمي ون بيس، ظهر في الحلقة الأولى من المسلسل", 
          answer: "كوبي", 
          image: "https://i.imgur.com/ICVEr1p.png" 
        },
        { 
          question: "طالب في المرحلة الثانوية عثر على مذكرة الموت", 
          answer: "ياغامي لايت", 
          image: "https://i.imgur.com/09NjhBv.jpeg" 
        },
        { 
          question: "قائد فرقة خاصة في فيلق الإستطلاع، أقوى جندي في البشرية", 
          answer: "ليفاي", 
          image: "https://i.imgur.com/zW132oo.png" 
        },
        { 
          question: "أحد أقوى قراصنة اللحية البيضاء، يلقب بـالعنقاء", 
          answer: "ماركو", 
          image: "https://i.imgur.com/5BunLah.png" 
        },
        { 
          question: "نينجا قوي جدا، يتميز بالهدوء والثقة بالنفس", 
          answer: "مادارا", 
          image: "https://i.imgur.com/OLzeUHD.png" 
        },
        { 
          question: "واحدة من الأعضاء البارزين في فيلق الاستكشاف", 
          answer: "ميكاسا", 
          image: "https://i.imgur.com/83wmWDQ.png" 
        },
        { 
          question: "شقيقة تانجيرو الأصغر، التي تحولت إلى شيطان", 
          answer: "نيزكو", 
          image: "https://i.imgur.com/0UkUSR4.jpeg" 
        }
      ];

      const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
      const correctAnswer = randomQuestion.answer.toLowerCase();

      const message = `▱▱▱▱▱▱▱▱▱▱▱▱▱\n\t🌟 | خمن إسم الشخصية :\n\t\t\t\t${randomQuestion.question}\nرد على هذه الرسالة بالجواب الصحيح\n⚠️ | تجنب كتابة الإسم الكامل للشخصية والهمزة\n▱▱▱▱▱▱▱▱▱▱▱▱▱`;

      api.setMessageReaction("🎲", event.messageID, (err) => {}, true);

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
            image: randomQuestion.image,
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
      }, event.messageID);

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

        // Check if any part of the correct answer is in the user's answer
        if (correctAnswer.split(' ').some(part => userAnswer.includes(part))) {
          try {
            // Download and save the image
            const imageResponse = await axios.get(reply.image, { responseType: "arraybuffer", timeout: 10000 });
            fs.writeFileSync(tempImageFilePath, Buffer.from(imageResponse.data, "binary"));
            const attachment = fs.createReadStream(tempImageFilePath);

            // Update user points
            const pointsData = JSON.parse(fs.readFileSync(userDataFile, "utf8"));
            const userPoints = pointsData[event.senderID] || { name: userName, points: 0 };
            userPoints.points += 100;
            pointsData[event.senderID] = userPoints;
            fs.writeFileSync(userDataFile, JSON.stringify(pointsData, null, 2));

            api.setMessageReaction("✅", event.messageID, (err) => {}, true);
            api.sendMessage(
              { body: `◆❯━━━━━▣✦▣━━━━━━❮◆\n✅ | تهانينا يا ${userName} 🥳 لقد خمنت إسم الشخصية بشكل صحيح وربحت『 100』 نقطة\n🎯 | الجواب : ${correctAnswer}\n◆❯━━━━━▣✦▣━━━━━━❮◆`, attachment },
              event.threadID,
              event.messageID
            );
          } catch (imgErr) {
            console.warn("[CHARACTERS] فشل في تحميل الصورة:", imgErr.message);
            
            const pointsData = JSON.parse(fs.readFileSync(userDataFile, "utf8"));
            const userPoints = pointsData[event.senderID] || { name: userName, points: 0 };
            userPoints.points += 100;
            pointsData[event.senderID] = userPoints;
            fs.writeFileSync(userDataFile, JSON.stringify(pointsData, null, 2));

            api.sendMessage(
              `✅ | تهانينا يا ${userName} 🥳 لقد خمنت إسم الشخصية بشكل صحيح وربحت『 100』 نقطة\n🎯 | الجواب : ${correctAnswer}`,
              event.threadID,
              event.messageID
            );
          }
        } else {
          api.setMessageReaction("❌", event.messageID, (err) => {}, true);
          api.sendMessage(`❌ | آسفة ، لم تكن تلك الإجابة الصحيحة. حاول مرة أخرى.`, event.threadID, event.messageID);
        }
      }
    } catch (error) {
      console.error("[CHARACTERS] خطأ في onReply:", error);
      api.sendMessage("❌ حدث خطأ أثناء معالجة الرد.", event.threadID, event.messageID);
    }
  }
}

export default new CharactersCommand();
