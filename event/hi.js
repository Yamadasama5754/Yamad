import axios from 'axios';
import fs from 'fs';
import path from 'path';
import moment from 'moment-timezone';
import config from '../KaguyaSetUp/config.js';

const DEVELOPERS = config.ADMIN_IDS || [];

async function execute({ api, event }) {
  if (event.logMessageType !== "log:subscribe") return;

  const botUserID = api.getCurrentUserID();
  const { addedParticipants, actor } = event.logMessageData;

  if (!addedParticipants || addedParticipants.length === 0) return;

  // التحقق من انضمام البوت للمجموعة
  for (const participant of addedParticipants) {
    if (participant.userFbId === botUserID) {
      // البوت تم إضافته للمجموعة
      await handleBotAdded(api, event, actor);
      return;
    }
  }

  // ترحيب بالأعضاء الجدد
  for (const participant of addedParticipants) {
    try {
      const userInfo = await api.getUserInfo(participant.userFbId);
      const profileName = userInfo[participant.userFbId]?.name || "Unknown";
      const avatarUrl = `https://graph.facebook.com/${participant.userFbId}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

      const threadInfo = await api.getThreadInfo(event.threadID);
      const threadName = threadInfo.threadName || "Unknown";
      const membersCount = threadInfo.participantIDs?.length || "Unknown";

      const date = moment().tz("Africa/Casablanca").format("YYYY-MM-DD");
      const time = moment().tz("Africa/Casablanca").format("hh:mm A").replace("AM", "صباحًا").replace("PM", "مساءً");

      const message = [
        "◆❯━━━━━▣✦▣━━━━━━❮◆",
        "≪👋 إشــعــار بــالإنــضــمــام 👋≫",
        `👥 | الأسـمـاء : 『${profileName}』`,
        `🔢 | الـترتـيـب : 『${membersCount}』`,
        `🧭 | إسـم الـمـجـموعـة :『${threadName}』`,
        `📅 | بـتـاريـخ : ${date}`,
        `⏰ | عـلـى الـوقـت : ${time}`,
        "『🔖 أهلاً بك معنا! 🔖』",
        "◆❯━━━━━▣✦▣━━━━━━❮◆"
      ].join("\n");

      await sendWelcomeCard(api, event.threadID, message, avatarUrl, profileName, threadName, membersCount);
    } catch (error) {
      console.error(`❌ [WELCOME] Failed for user ${participant.userFbId}:`, error.message);
      try {
        await api.sendMessage(`👋 أهلاً وسهلاً! تم إضافة عضو جديد للمجموعة`, event.threadID);
      } catch (e) {
        console.error("❌ خطأ في إرسال رسالة الترحيب البديلة:", e);
      }
    }
  }
}

async function handleBotAdded(api, event, actor) {
  // تم تعطيل - معالجة الإضافة في event/subscribe.js
}

function getRandomBackground() {
  const backgrounds = [
    "https://i.imgur.com/dDSh0wc.jpeg",
    "https://i.imgur.com/UucSRWJ.jpeg",
    "https://i.imgur.com/OYzHKNE.jpeg",
    "https://i.imgur.com/V5L9dPi.jpeg",
    "https://i.imgur.com/M7HEAMA.jpeg",
    "https://i.imgur.com/MnAwD8U.jpg",
    "https://i.imgur.com/tSkuyIu.jpg",
    "https://i.ibb.co/rvft0WP/923823d1a27d17d3319c4db6c0efb60c.jpg",
    "https://i.ibb.co/r4fMzsC/beautiful-fantasy-wallpaper-ultra-hd-wallpaper-4k-sr10012418-1706506236698-cover.webp",
    "https://i.ibb.co/Tm01gpv/peaceful-landscape-beautiful-background-wallpaper-nature-relaxation-ai-generation-style-watercolor-l.jpg",
    "https://i.ibb.co/qCsmcb6/image-13.png"
  ];
  return backgrounds[Math.floor(Math.random() * backgrounds.length)];
}

async function sendWelcomeCard(api, threadID, message, avatarUrl, profileName, threadName, membersCount) {
  const background = getRandomBackground();
  const apiUrl = `https://api.popcat.xyz/welcomecard?background=${encodeURIComponent(background)}&text1=${encodeURIComponent(profileName)}&text2=مرحبا بك إلى ${threadName}&text3=أنت العضو رقم ${membersCount}&avatar=${encodeURIComponent(avatarUrl)}`;

  try {
    const response = await axios.get(apiUrl, { responseType: 'arraybuffer' });
    const imagePath = path.join(process.cwd(), 'cache', `welcome_${Date.now()}.png`);
    fs.writeFileSync(imagePath, response.data);

    await api.sendMessage({ body: message, attachment: fs.createReadStream(imagePath) }, threadID);
    fs.unlinkSync(imagePath);
  } catch (error) {
    console.warn("[WELCOME] Failed to fetch image, sending text only.");
    await api.sendMessage(message, threadID);
  }
}

export default {
  name: "ترحيب",
  description: "يرسل رسالة ترحيب عند إضافة شخص جديد وحماية البوت من الإضافة غير المصرحة",
  execute,
};
