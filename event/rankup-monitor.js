class RankupMonitor {
  constructor() {
    this.name = "rankup-monitor";
    this.description = "مراقبة صعود المستوى وإرسال إشعارات";
  }

  expToLevel(point) {
    if (point < 0) return 0;
    return Math.floor((Math.sqrt(1 + (4 * point) / 3) + 1) / 2);
  }

  levelToExp(level) {
    if (level <= 0) return 0;
    return 3 * level * (level - 1);
  }

  async execute({ api, event, Users, Threads }) {
    try {
      // فقط للرسائل العادية
      if (event.type !== "message" || !event.isGroup) return;
      if (!event.body || event.body.trim().length === 0) return;

      const { threadID, senderID } = event;

      // الحصول على الخبرة الحالية
      const userInfo = await Users.find(senderID);
      if (!userInfo.status) return;

      const userData = userInfo.data.data || {};
      let currentExp = userData.exp || 0;
      const currentLevel = userData.level || 0;

      // أضف 1 خبرة لكل رسالة
      currentExp += 1;

      // احسب المستوى الجديد
      const newLevel = this.expToLevel(currentExp);

      // إذا صعد المستوى
      if (newLevel > currentLevel && newLevel !== 1) {
        try {
          const nameInfo = await api.getUserInfo(senderID);
          const userName = nameInfo[senderID]?.name || "Unknown";

          const message = `◆❯━━━━━▣✦▣━━━━━━❮◆
تـهـانـيـنـا يـا ${userName} ✨
 ارتـفـع مـسـتـواك إلـى [${newLevel}]
◆❯━━━━━▣✦▣━━━━━━❮◆`;

          api.sendMessage(
            { body: message, mentions: [{ tag: userName, id: senderID }] },
            threadID
          );
        } catch (e) {
          // لا تعطل البوت إذا فشل الإرسال
        }

        // تحديث المستوى في قاعدة البيانات
        await Users.update(senderID, { level: newLevel, exp: currentExp });
      } else {
        // فقط تحديث الخبرة
        await Users.update(senderID, { exp: currentExp });
      }

    } catch (error) {
      // تجاهل الأخطاء ولا تعطل البوت
    }
  }
}

const rankupMonitor = new RankupMonitor();

export default {
  name: "rankup-monitor",
  description: "مراقبة صعود المستوى وإرسال إشعارات",
  execute: rankupMonitor.execute.bind(rankupMonitor),
};
