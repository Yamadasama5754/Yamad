import axios from 'axios';
import fs from 'fs';
import path from 'path';
import moment from 'moment-timezone';
import jimp from 'jimp';

async function execute({ api, event, Users, Threads }) {
  const ownerFbIds = ["100092990751389"];  // قائمة بمعرفات الفيسبوك لأصحاب البوت المصرح لهم

  switch (event.logMessageType) {
    case "log:unsubscribe": {
      const { leftParticipantFbId, reason } = event.logMessageData;
      if (leftParticipantFbId == api.getCurrentUserID()) {
        return;
      }
      const userInfo = await api.getUserInfo(leftParticipantFbId);
      const profileName = userInfo[leftParticipantFbId]?.name || "Unknown";
      const type = event.author == leftParticipantFbId ? "غادر لوحده" : "طرده الآدمن";
      const farewellReason = getFarewellReason(reason);
      const membersCount = await api.getThreadInfo(event.threadID).then(info => info.participantIDs.length).catch(error => {
        console.error('Error getting members count:', error);
        return "Unknown";
      });
      const farewellMessage = `❏ الإســم 👤 : 『${profileName}』 \n❏ الـسـبـب 📝 : \n『${type}』 \n 『${farewellReason}』\n❏ المـتـبـقـيـيـن : ${membersCount} عـضـو`;
      const profilePicturePath = await getProfilePicture(leftParticipantFbId);
      await sendWelcomeOrFarewellMessage(api, event.threadID, farewellMessage, profilePicturePath);
      break;
    }
    case "log:subscribe": {
      // تم تعطيل معالجة إضافة البوت هنا
      // ستتم المعالجة فقط في event/ترحيب.js لتجنب الرسائل المزدوجة
      break;
    }
  }
}

async function handleBotAddition(api, event, ownerFbIds) {
  try {
    const threadInfo = await api.getThreadInfo(event.threadID);
    const threadName = threadInfo.threadName || "Unknown";
    const membersCount = threadInfo.participantIDs.length;
    const addedBy = event.author;
    const addedByInfo = await api.getUserInfo(addedBy);
    const addedByName = addedByInfo[addedBy]?.name || "Unknown";
    const AUTHORIZED_DEV = "100092990751389";

    if (!ownerFbIds.includes(addedBy)) {
      // من أضاف البوت ليس مصرح - رفض وخروج
      const rejectMsg = `⚠️ | إضافة البوت بدون إذن غير مسموح يرجى التواصل مع المطور من أجل الحصول على الموافقة 
 📞 | رابـط الـمـطـور : https://www.facebook.com/profile.php?id=100092990751389`;
      
      try {
        await api.sendMessage(rejectMsg, event.threadID);
      } catch (e) {
        console.error('[BOT_ADDITION] Error sending message:', e.message);
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      try {
        await api.removeUserFromGroup(api.getCurrentUserID(), event.threadID);
        console.log(`🚫 تم رفض إضافة البوت من قبل ${addedByName} (${addedBy}) والخروج`);
      } catch (e) {
        console.error('[BOT_ADDITION] Error leaving:', e.message);
      }
    } else {
      // من أضاف البوت مصرح - إرسال إشعار للملاك
      const notifyOwnerMessage = `✅ تم إضافة البوت إلى مجموعة جديدة! \n📍 اسم المجموعة: ${threadName} \n🔢 عدد الأعضاء: ${membersCount}`;
      try {
        await api.sendMessage(notifyOwnerMessage, ownerFbIds[0]);
      } catch (e) {
        // تجاهل الأخطاء
      }
      console.log(`✅ تم تنشيط البوت من قبل المطور المصرح: ${addedByName}`);
    }
  } catch (error) {
    console.error('[BOT_ADDITION] Error:', error);
  }
}

async function sendWelcomeOrFarewellMessage(api, threadID, message, attachmentPath) {
  try {
    await api.sendMessage({
      body: message,
      attachment: fs.createReadStream(attachmentPath),
    }, threadID);
  } catch (error) {
    console.error('Error sending welcome or farewell message:', error);
  }
}

async function getProfilePicture(userID) {
  const url = `https://graph.facebook.com/${userID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
  const img = await jimp.read(url);
  const profilePath = path.join(process.cwd(), 'cache', `profile_${userID}.png`);
  await img.writeAsync(profilePath);
  return profilePath;
}

function getFarewellReason(reason) {
  return reason === "leave" ? "ناقص واحد ناقص مشكلة 😉" : "لاتنسى تسكر الباب وراك 🙂";
}

export default {
  name: "ترحيب_ومغادرة",
  description: "يتم استدعاء هذا الأمر عندما ينضم شخص جديد إلى المجموعة أو يغادرها.",
  execute,
};
