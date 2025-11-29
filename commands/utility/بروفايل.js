import path from 'path';
import fs from 'fs';

export default {
  name: "بروفايل",
  author: "Kaguya Project",
  role: 0,
  description: "عرض بروفايلك وإحصائياتك",
  aliases: ["profile", "بروفايلي"],

  async execute({ api, event, Economy, Users }) {
    try {
      const userID = event.senderID;
      
      // الحصول على معلومات المستخدم
      const userInfo = await api.getUserInfo(userID);
      const userName = userInfo[userID]?.name || "Unknown";
      
      // الحصول على الرصيد
      const balance = (await Economy.getBalance(userID)).data;
      
      // محاولة قراءة نقاط الشخصيات إذا كانت موجودة
      let characterPoints = 0;
      try {
        const pointsPath = path.join(process.cwd(), 'charactersPoints.json');
        if (fs.existsSync(pointsPath)) {
          const data = JSON.parse(fs.readFileSync(pointsPath, 'utf8'));
          characterPoints = data[userID]?.points || 0;
        }
      } catch (e) {}

      // محاولة قراءة نقاط الرانك إذا كانت موجودة
      let rankPoints = 0;
      try {
        const rankPath = path.join(process.cwd(), 'pontsData.json');
        if (fs.existsSync(rankPath)) {
          const data = JSON.parse(fs.readFileSync(rankPath, 'utf8'));
          rankPoints = data[userID]?.points || 0;
        }
      } catch (e) {}

      // محاولة قراءة رصيد البنك
      let bankBalance = 0;
      try {
        const bankPath = path.join(process.cwd(), 'bank.json');
        if (fs.existsSync(bankPath)) {
          const data = JSON.parse(fs.readFileSync(bankPath, 'utf8'));
          bankBalance = data[userID]?.balance || 0;
        }
      } catch (e) {}

      const totalAssets = balance + bankBalance;
      const totalPoints = characterPoints + rankPoints;

      const profile = `
👤 ══════════════════════════════════
📛 **الاسم:** ${userName}
🆔 **ID:** ${userID}

💰 ══════════════════════════════════
💵 **المحفظة:** ${balance} دولار
🏦 **البنك:** ${bankBalance} دولار
💎 **إجمالي الأصول:** ${totalAssets} دولار

🎮 ══════════════════════════════════
⭐ **نقاط الألعاب:** ${totalPoints}
🎯 **نقاط الشخصيات:** ${characterPoints}
🏅 **نقاط الترتيب:** ${rankPoints}

══════════════════════════════════
      `;

      api.setMessageReaction("👤", event.messageID, (err) => {}, true);
      return api.sendMessage(profile.trim(), event.threadID);

    } catch (error) {
      console.error("[PROFILE] Error:", error.message);
      return api.sendMessage("❌ | حدث خطأ، يرجى المحاولة لاحقاً", event.threadID);
    }
  }
};
