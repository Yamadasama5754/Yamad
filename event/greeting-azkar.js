import moment from "moment-timezone";
import cron from 'node-cron';
import fs from 'fs-extra';
import path from 'path';

// ============ قسم التحيات والترحيب ============
const greetingKeywords = [
  "أهلا", "مرحبا", "هلا", "هاي", "هلو"
];

const greetingResponses = [
  "كيف الحال يا حلو 😺🩷",
  "أهلا وسهلا 🩷",
  "حياك الله ✨🐿",
  "إسمي ميراي، ماهو اسمك 🐿🩷",
  "اكتب قائمة أو اوامر للقوائم 📋😸",
  "لدي 42 امر في خدمتك 🔱😺",
  "أتمنى أن تكون بخير ✨🐢",
  "ميراي هنا للمساعدة 🐢",
  "استخدم تقرير للتواصل مع مطوري 📞👽",
  "في خدمتك 🐢🔱",
  "ياهلا ياهلا يا حبيبي! 🎉🐍",
  "سعيدة بلقياك 💫🐍",
];

const stickers = [
  "1747083968936188", "1747090242268894", "1747089445602307", "1747085962269322",
  "1747084572269461", "1747092188935366", "1747088982269020", "2041012539459553"
];

// ============ قسم الأذكار حسب الأوقات ============
const azkarFajr = [
  "🌅 أذكار الفجر:\n\nأصبحنا وأصبح الملك لله والحمد لله، لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير",
  "🌅 الحمد لله الذي أحيانا بعد ما أماتنا وإليه النشور",
];

const azkarMorning = [
  "☀️ أذكار الصباح:\n\nبسم الله ما شاء الله لا قوة إلا بالله، اللهم بك أصبحنا وبك أمسينا وبك نحيا وبك نموت وإليك النشور",
  "☀️ اللهم إني أسألك حسن الخاتمة، وأعوذ بك من سوء الخاتمة",
];

const azkarDhuhr = [
  "🕐 أذكار الظهيرة:\n\nسبحان الله وبحمده، سبحان الله العظيم، استغفر الله وأتوب إليه",
  "🕐 اللهم إني أسألك من خير هذا الوقت وأعوذ بك من شره",
];

const azkarAsr = [
  "🕓 أذكار العصر:\n\nاللهم اجعل آخر كلامي شهادة أن لا إله إلا أنت، وأن محمداً عبدك ورسولك",
  "🕓 سبحان الله والحمد لله ولا إله إلا الله والله أكبر، ولا حول ولا قوة إلا بالله",
];

const azkarMaghrib = [
  "🌅 أذكار المغرب:\n\nأمسينا وأمسى الملك لله والحمد لله، لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير",
  "🌅 اللهم بك أمسينا وبك أصبحنا وبك نحيا وبك نموت وإليك المصير",
];

const azkarIsha = [
  "🌙 أذكار العشاء:\n\nالحمد لله الذي أمسى بنا ولم نصبح على حال من أحوال الدنيا أسوأ، اللهم أنت ربي لا إله إلا أنت",
  "🌙 اللهم إني أسلمت وجهي إليك وفوضت أمري إليك والجأت ظهري إليك رغبة ورهبة إليك",
];

const azkarEvening = [
  "🌙 أذكار المساء:\n\nأمسينا وأمسى الملك لله رب العالمين، اللهم إني أسألك خير هذه الليلة فتحها ونصرها ونورها وبركتها وهداها",
  "🌙 اللهم احفظنا بالإسلام قائمين، واحفظنا بالإسلام قاعدين، واحفظنا بالإسلام راقدين",
];

const azkarNight = [
  "🌃 أذكار الليل:\n\nبسم الله الذي لا يضر مع اسمه شيء في الأرض ولا في السماء وهو السميع العليم",
  "🌃 اللهم بك أنام وبك أستيقظ، وبك أموت وبك أحيا، اللهم اغفر لي ذنبي",
];

let registeredGroups = [];
const groupsFile = path.join(process.cwd(), 'database/azkar-groups.json');

const loadRegisteredGroups = () => {
  try {
    if (fs.existsSync(groupsFile)) {
      registeredGroups = fs.readJsonSync(groupsFile);
    } else {
      registeredGroups = [];
      fs.ensureFileSync(groupsFile);
      fs.writeFileSync(groupsFile, JSON.stringify([], null, 2));
    }
  } catch (error) {
    console.error('خطأ في تحميل المجموعات:', error);
    registeredGroups = [];
  }
};

const saveRegisteredGroups = () => {
  try {
    fs.writeFileSync(groupsFile, JSON.stringify(registeredGroups, null, 2));
  } catch (error) {
    console.error('خطأ في حفظ المجموعات:', error);
  }
};

const scheduleAzkar = async (api) => {
  loadRegisteredGroups();
  
  // الفجر: 5:30 صباحاً
  cron.schedule('30 5 * * *', () => {
    console.log('🌅 إرسال أذكار الفجر...');
    registeredGroups.forEach((groupID) => {
      try {
        const randomAzkar = azkarFajr[Math.floor(Math.random() * azkarFajr.length)];
        api.sendMessage(`═══════════════════\n${"🌅".repeat(3)}\nأذكار الفجر\n${"🌅".repeat(3)}\n═══════════════════\n\n${randomAzkar}`, groupID);
      } catch (error) {
        console.error(`خطأ في إرسال أذكار الفجر:`, error);
      }
    });
  }, { timezone: 'Africa/Casablanca' });

  // الصباح: 7:00 صباحاً
  cron.schedule('0 7 * * *', () => {
    console.log('☀️ إرسال أذكار الصباح...');
    registeredGroups.forEach((groupID) => {
      try {
        const randomAzkar = azkarMorning[Math.floor(Math.random() * azkarMorning.length)];
        api.sendMessage(`═══════════════════\n${"☀️".repeat(3)}\nأذكار الصباح\n${"☀️".repeat(3)}\n═══════════════════\n\n${randomAzkar}`, groupID);
      } catch (error) {
        console.error(`خطأ في إرسال أذكار الصباح:`, error);
      }
    });
  }, { timezone: 'Africa/Casablanca' });

  // الظهر: 12:00 ظهراً
  cron.schedule('0 12 * * *', () => {
    console.log('🕐 إرسال أذكار الظهيرة...');
    registeredGroups.forEach((groupID) => {
      try {
        const randomAzkar = azkarDhuhr[Math.floor(Math.random() * azkarDhuhr.length)];
        api.sendMessage(`═══════════════════\n${"🕐".repeat(3)}\nأذكار الظهيرة\n${"🕐".repeat(3)}\n═══════════════════\n\n${randomAzkar}`, groupID);
      } catch (error) {
        console.error(`خطأ في إرسال أذكار الظهيرة:`, error);
      }
    });
  }, { timezone: 'Africa/Casablanca' });

  // العصر: 16:00 (4 مساءً)
  cron.schedule('0 16 * * *', () => {
    console.log('🕓 إرسال أذكار العصر...');
    registeredGroups.forEach((groupID) => {
      try {
        const randomAzkar = azkarAsr[Math.floor(Math.random() * azkarAsr.length)];
        api.sendMessage(`═══════════════════\n${"🕓".repeat(3)}\nأذكار العصر\n${"🕓".repeat(3)}\n═══════════════════\n\n${randomAzkar}`, groupID);
      } catch (error) {
        console.error(`خطأ في إرسال أذكار العصر:`, error);
      }
    });
  }, { timezone: 'Africa/Casablanca' });

  // المغرب: 18:00 (6 مساءً)
  cron.schedule('0 18 * * *', () => {
    console.log('🌅 إرسال أذكار المغرب...');
    registeredGroups.forEach((groupID) => {
      try {
        const randomAzkar = azkarMaghrib[Math.floor(Math.random() * azkarMaghrib.length)];
        api.sendMessage(`═══════════════════\n${"🌅".repeat(3)}\nأذكار المغرب\n${"🌅".repeat(3)}\n═══════════════════\n\n${randomAzkar}`, groupID);
      } catch (error) {
        console.error(`خطأ في إرسال أذكار المغرب:`, error);
      }
    });
  }, { timezone: 'Africa/Casablanca' });

  // العشاء: 20:00 (8 مساءً)
  cron.schedule('0 20 * * *', () => {
    console.log('🌙 إرسال أذكار العشاء...');
    registeredGroups.forEach((groupID) => {
      try {
        const randomAzkar = azkarIsha[Math.floor(Math.random() * azkarIsha.length)];
        api.sendMessage(`═══════════════════\n${"🌙".repeat(3)}\nأذكار العشاء\n${"🌙".repeat(3)}\n═══════════════════\n\n${randomAzkar}`, groupID);
      } catch (error) {
        console.error(`خطأ في إرسال أذكار العشاء:`, error);
      }
    });
  }, { timezone: 'Africa/Casablanca' });

  // المساء: 19:00 (7 مساءً)
  cron.schedule('0 19 * * *', () => {
    console.log('🌙 إرسال أذكار المساء...');
    registeredGroups.forEach((groupID) => {
      try {
        const randomAzkar = azkarEvening[Math.floor(Math.random() * azkarEvening.length)];
        api.sendMessage(`═══════════════════\n${"🌙".repeat(3)}\nأذكار المساء\n${"🌙".repeat(3)}\n═══════════════════\n\n${randomAzkar}`, groupID);
      } catch (error) {
        console.error(`خطأ في إرسال أذكار المساء:`, error);
      }
    });
  }, { timezone: 'Africa/Casablanca' });

  // الليل: 22:00 (10 مساءً)
  cron.schedule('0 22 * * *', () => {
    console.log('🌃 إرسال أذكار الليل...');
    registeredGroups.forEach((groupID) => {
      try {
        const randomAzkar = azkarNight[Math.floor(Math.random() * azkarNight.length)];
        api.sendMessage(`═══════════════════\n${"🌃".repeat(3)}\nأذكار الليل\n${"🌃".repeat(3)}\n═══════════════════\n\n${randomAzkar}`, groupID);
      } catch (error) {
        console.error(`خطأ في إرسال أذكار الليل:`, error);
      }
    });
  }, { timezone: 'Africa/Casablanca' });

  console.log('✅ نظام الأذكار المجدول بدأ بنجاح مع 8 أوقات');
};

// ============ الحدث الموحد ============
export default {
  name: 'greeting-azkar',
  description: 'حدث موحد للتحيات والأذكار',
  onLoad: async () => {
    loadRegisteredGroups();
  },
  execute: async ({ event, api, Users }) => {
    try {
      if (event.type !== "message" || !event.body || event.body.startsWith(".")) return;

      const messageLower = event.body.toLowerCase().trim();
      
      // معالجة التحيات العامة
      const hasGreeting = greetingKeywords.some(keyword => messageLower.includes(keyword));
      if (hasGreeting) {
        const sticker = stickers[Math.floor(Math.random() * stickers.length)];
        const response = greetingResponses[Math.floor(Math.random() * greetingResponses.length)];
        
        try {
          const name = await Users.getNameUser(event.senderID);
          const mentions = [{ tag: name, id: event.senderID }];
          const msg = {
            body: `أهلا يا ${name}، ${response}`,
            mentions
          };

          api.sendMessage(msg, event.threadID, (e, info) => {
            setTimeout(() => {
              api.sendMessage({ sticker }, event.threadID);
            }, 100);
          }, event.messageID);
        } catch (err) {
          console.error("خطأ في الرد على الترحيب:", err);
          api.sendMessage(greetingResponses[Math.floor(Math.random() * greetingResponses.length)], event.threadID, event.messageID);
        }
      }

    } catch (error) {
      console.error("خطأ في حدث الترحيب:", error);
    }
  },
  addGroup: (groupID) => {
    if (!registeredGroups.includes(groupID)) {
      registeredGroups.push(groupID);
      saveRegisteredGroups();
      return true;
    }
    return false;
  },
  removeGroup: (groupID) => {
    const index = registeredGroups.indexOf(groupID);
    if (index > -1) {
      registeredGroups.splice(index, 1);
      saveRegisteredGroups();
      return true;
    }
    return false;
  },
  scheduleAzkar
};
