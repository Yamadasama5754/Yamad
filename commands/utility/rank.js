class RankCommand {
  constructor() {
    this.name = "رانك";
    this.author = "Yamada KJ";
    this.cooldowns = 5;
    this.description = "عرض مستواك أو مستوى الشخص المُشار إليه";
    this.role = 0;
    this.aliases = ["rank", "مستوى", "رتبة"];
  }

  async execute({ api, event, Users, Threads }) {
    try {
      api.setMessageReaction("⏳", event.messageID, (err) => {}, true);

      let targetUsers;
      const arrayMentions = Object.keys(event.mentions || {});

      if (arrayMentions.length === 0)
        targetUsers = [event.senderID];
      else
        targetUsers = arrayMentions;

      const deltaNext = 5;
      const expToLevel = (exp) => Math.floor((1 + Math.sqrt(1 + 8 * exp / deltaNext)) / 2);
      const levelToExp = (level) => Math.floor(((Math.pow(level, 2) - level) * deltaNext) / 2);

      let resultMessage = "";

      for (const userID of targetUsers) {
        try {
          const userData = await Users.get(userID);
          const { exp = 0 } = userData;
          const levelUser = expToLevel(exp);

          const expNextLevel = levelToExp(levelUser + 1) - levelToExp(levelUser);
          const currentExp = expNextLevel - (levelToExp(levelUser + 1) - exp);

          const allUser = await Users.getAll();
          allUser.sort((a, b) => b.exp - a.exp);
          const rank = allUser.findIndex(user => user.userID == userID) + 1;

          let userName = "Unknown";
          try {
            const userInfo = await api.getUserInfo(userID);
            userName = userInfo[userID]?.name || "Unknown";
          } catch (e) {
            console.warn("[RANK] Could not get user info");
          }

          const expBar = this.createExpBar(currentExp, expNextLevel);

          resultMessage += `
━━━━━━━━━━━━━━━━
👤 الاسم: ${userName}
📊 المستوى: ${levelUser}
🏆 المرتبة: #${rank}/${allUser.length}
⭐ الخبرة: ${Math.floor(currentExp)}/${expNextLevel}
${expBar}
━━━━━━━━━━━━━━━━
`;
        } catch (e) {
          console.error("[RANK] Error making card:", e.message);
          resultMessage += `❌ خطأ في الحصول على بيانات المستخدم\n`;
        }
      }

      if (!resultMessage) {
        api.setMessageReaction("❌", event.messageID, (err) => {}, true);
        return api.sendMessage("❌ حدث خطأ في الأمر", event.threadID, event.messageID);
      }

      api.setMessageReaction("✅", event.messageID, (err) => {}, true);
      return api.sendMessage(resultMessage, event.threadID);

    } catch (err) {
      console.error("[RANK] Error:", err);
      api.setMessageReaction("❌", event.messageID, (err) => {}, true);
      api.sendMessage("❌ حدث خطأ في الأمر: " + err.message, event.threadID, event.messageID);
    }
  }

  createExpBar(current, max) {
    const percentage = Math.floor((current / max) * 20);
    const filled = "█".repeat(percentage);
    const empty = "░".repeat(20 - percentage);
    const percent = Math.floor((current / max) * 100);
    return `[${filled}${empty}] ${percent}%`;
  }

  async onReply({ api, event, Users }) {
    try {
      let userData = await Users.get(event.senderID);
      let { exp = 0 } = userData;
      if (isNaN(exp) || typeof exp !== "number")
        exp = 0;
      await Users.set(event.senderID, {
        exp: exp + 1
      });
    } catch (e) {
      console.warn("[RANK] Warning: Could not update exp");
    }
  }
}

export default new RankCommand();
