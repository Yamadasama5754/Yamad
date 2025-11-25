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

// ============ قسم الأذكار ============
const azkarMorning = [
  "🌅 الحمد لله الذي أحيانا بعد ما أماتنا وإليه النشور",
  "🌅 أصبحنا وأصبح الملك لله والحمد لله، لا إله إلا الله وحده لا شريك له"
];

const azkarEvening = [
  "🌙 الحمد لله الذي أحيانا بعد ما أماتنا وإليه النشور",
  "🌙 أمسينا وأمسى الملك لله والحمد لله، لا إله إلا الله وحده لا شريك له"
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
  
  cron.schedule('0 6 * * *', () => {
    console.log('🌅 إرسال أذكار الصباح...');
    registeredGroups.forEach((groupID) => {
      try {
        const randomAzkar = azkarMorning[Math.floor(Math.random() * azkarMorning.length)];
        api.sendMessage({
          body: `═══════════════════\n${"🌅".repeat(5)}\nأذكار الصباح\n${"🌅".repeat(5)}\n═══════════════════\n\n${randomAzkar}`
        }, groupID);
      } catch (error) {
        console.error(`خطأ في إرسال أذكار الصباح:`, error);
      }
    });
  }, { timezone: 'Africa/Casablanca' });

  cron.schedule('0 18 * * *', () => {
    console.log('🌙 إرسال أذكار المساء...');
    registeredGroups.forEach((groupID) => {
      try {
        const randomAzkar = azkarEvening[Math.floor(Math.random() * azkarEvening.length)];
        api.sendMessage({
          body: `═══════════════════\n${"🌙".repeat(5)}\nأذكار المساء\n${"🌙".repeat(5)}\n═══════════════════\n\n${randomAzkar}`
        }, groupID);
      } catch (error) {
        console.error(`خطأ في إرسال أذكار المساء:`, error);
      }
    });
  }, { timezone: 'Africa/Casablanca' });

  console.log('✅ نظام الأذكار المجدول بدأ بنجاح');
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
