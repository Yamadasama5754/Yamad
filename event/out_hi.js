import axios from 'axios';
import fs from 'fs';
import path from 'path';
import moment from 'moment-timezone';
import jimp from 'jimp';

async function execute({ api, event, Users, Threads }) {
  const ownerFbIds = ["100092990751389"];

  try {
    if (event.logMessageType === "log:unsubscribe") {
      const { leftParticipantFbId, reason } = event.logMessageData;
      
      // تجاهل إذا خرج البوت نفسه
      if (leftParticipantFbId == api.getCurrentUserID()) {
        return;
      }

      try {
        const userInfo = await api.getUserInfo(leftParticipantFbId);
        const profileName = userInfo[leftParticipantFbId]?.name || "Unknown";
        const type = event.author == leftParticipantFbId ? "🚶 غادر لوحده" : "🔨 طرده الآدمن";
        const farewellReason = getFarewellReason(reason);
        
        let membersCount = "Unknown";
        try {
          const threadInfo = await api.getThreadInfo(event.threadID);
          membersCount = threadInfo.participantIDs?.length || "Unknown";
        } catch (e) {
          console.warn('⚠️ خطأ في الحصول على عدد الأعضاء:', e.message);
        }

        const farewellMessage = [
          "◆❯━━━━━▣✦▣━━━━━━❮◆",
          "≪👋 إشــعــار بــالـمـغـادرة 👋≫",
          `👤 | الإسـم : 『${profileName}』`,
          `📝 | النـوع : 『${type}』`,
          `💬 | الـسـبـب : 『${farewellReason}』`,
          `👥 | المـتـبـقـيـيـن : 『${membersCount} عـضـو』`,
          "『🔖 نتمنى لك حياة جميلة! 🔖』",
          "◆❯━━━━━▣✦▣━━━━━━❮◆"
        ].join("\n");

        try {
          const profilePicturePath = await getProfilePicture(leftParticipantFbId);
          await sendWelcomeOrFarewellMessage(api, event.threadID, farewellMessage, profilePicturePath);
        } catch (picError) {
          console.warn('⚠️ خطأ في الحصول على صورة الملف الشخصي، سيتم إرسال النص فقط:', picError.message);
          await api.sendMessage(farewellMessage, event.threadID);
        }
      } catch (error) {
        console.error('❌ خطأ في معالجة المغادرة:', error.message);
        await api.sendMessage("👋 | غادر عضو من المجموعة", event.threadID);
      }
    } 
    else if (event.logMessageType === "log:subscribe") {
      // معالجة في hi.js فقط لتجنب الرسائل المزدوجة
      return;
    }
  } catch (error) {
    console.error('❌ [OUT_HI] خطأ عام:', error.message);
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
    if (attachmentPath && fs.existsSync(attachmentPath)) {
      await api.sendMessage({
        body: message,
        attachment: fs.createReadStream(attachmentPath),
      }, threadID);
      
      // حذف الملف بعد الإرسال
      setTimeout(() => {
        try {
          if (fs.existsSync(attachmentPath)) {
            fs.unlinkSync(attachmentPath);
          }
        } catch (e) {}
      }, 1000);
    } else {
      // إرسال النص فقط
      await api.sendMessage(message, threadID);
    }
  } catch (error) {
    console.error('❌ خطأ في إرسال رسالة المغادرة:', error.message);
    // إرسال النص كبديل
    try {
      await api.sendMessage(message, threadID);
    } catch (e) {
      console.error('❌ فشل إرسال رسالة المغادرة البديلة:', e.message);
    }
  }
}

async function getProfilePicture(userID) {
  try {
    const url = `https://graph.facebook.com/${userID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
    
    // تأكد من وجود مجلد cache
    const cacheDir = path.join(process.cwd(), 'cache');
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }

    const img = await jimp.read(url);
    const profilePath = path.join(cacheDir, `profile_${userID}_${Date.now()}.png`);
    await img.writeAsync(profilePath);
    return profilePath;
  } catch (error) {
    console.warn('⚠️ خطأ في تحميل الصورة:', error.message);
    throw error;
  }
}

function getFarewellReason(reason) {
  return reason === "leave" ? "ناقص واحد ناقص مشكلة 😉" : "لاتنسى تسكر الباب وراك 🙂";
}

export default {
  name: "ترحيب_ومغادرة",
  description: "يتم استدعاء هذا الأمر عندما ينضم شخص جديد إلى المجموعة أو يغادرها.",
  execute,
};
