import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class LevelCommand {
  constructor() {
    this.name = "مستواي";
    this.author = "Yamada KJ & Enhanced";
    this.cooldowns = 10;
    this.description = "عرض مستواك والخبرة الحالية في هيكل الترتيب";
    this.role = 0;
    this.aliases = ["مستواي", "level", "rank"];
  }

  expToLevel(point) {
    if (point < 0) return 0;
    return Math.floor((Math.sqrt(1 + (4 * point) / 3) + 1) / 2);
  }

  levelToExp(level) {
    if (level <= 0) return 0;
    return 3 * level * (level - 1);
  }

  async execute({ api, event, args, Users, Exp }) {
    try {
      const { senderID, threadID, messageID } = event;

      // الحصول على معلومات المستخدم
      const userInfo = await Users.find(senderID);
      if (!userInfo.status) {
        return api.sendMessage(
          "❌ لم يتم العثور على معلوماتك في قاعدة البيانات. حاول مجددًا لاحقًا.",
          threadID,
          messageID
        );
      }

      const userData = userInfo.data.data;
      const currentLevel = userData.level || 0;
      const currentExp = userData.exp || 0;

      // حساب معلومات المستوى
      const expForCurrentLevel = this.levelToExp(currentLevel);
      const expForNextLevel = this.levelToExp(currentLevel + 1);
      const expNeeded = expForNextLevel - expForCurrentLevel;
      const expProgress = currentExp - expForCurrentLevel;
      const progressPercent = ((expProgress / expNeeded) * 100).toFixed(1);

      // الحصول على اسم المستخدم
      const nameInfo = await api.getUserInfo(senderID);
      const userName = nameInfo[senderID]?.name || "Unknown";

      // حساب الترتيب (إذا كان متاحًا من المتحكمات)
      let rank = "?";
      try {
        const allUsers = await Users.getAll?.() || [];
        if (Array.isArray(allUsers)) {
          const sortedUsers = allUsers
            .filter(u => u.level !== undefined)
            .sort((a, b) => (b.level || 0) - (a.level || 0));
          const userRank = sortedUsers.findIndex(u => u.uid == senderID);
          rank = userRank >= 0 ? userRank + 1 : "?";
        }
      } catch (err) {
        console.warn("Error calculating rank:", err.message);
      }

      // بناء رسالة المستوى
      const progressBar = this.createProgressBar(expProgress, expNeeded);
      
      const message = `
╭━━━━━━━━━━━━━━━━━━━━━━╮
│  📊 معلومات مستواك
╰━━━━━━━━━━━━━━━━━━━━━━╯

👤 الاسم: ${userName}
🏆 الترتيب: #${rank}
📈 المستوى: ${currentLevel}
⭐ الخبرة الحالية: ${expProgress} / ${expNeeded}
📊 نسبة التقدم: ${progressPercent}%

${progressBar}

💡 المستوى التالي متبقي: ${expNeeded - expProgress} خبرة
━━━━━━━━━━━━━━━━━━━━━━
`;

      api.sendMessage(message, threadID, messageID);

    } catch (error) {
      console.error("Level command error:", error);
      api.sendMessage(
        `❌ حدث خطأ: ${error.message}`,
        event.threadID,
        event.messageID
      );
    }
  }

  createProgressBar(current, total, length = 20) {
    const percent = Math.round((current / total) * length);
    const filled = "█".repeat(percent);
    const empty = "░".repeat(length - percent);
    return `[${filled}${empty}]`;
  }
}

export default new LevelCommand();
