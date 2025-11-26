import fs from "fs-extra";
import path from "path";

class AnimeCommand {
  constructor() {
    this.name = "تقطيم";
    this.author = "Yamada KJ & Alastor";
    this.cooldowns = 5;
    this.description = "إرسال صور أنمي عشوائية بسرعة وجودة عالية";
    this.role = 0;
    this.aliases = ["anime", "تقطيمة"];
  }

  async execute({ api, event }) {
    try {
      api.setMessageReaction("⏳", event.messageID, (err) => {}, true);

      // قراءة ملف الأنمي
      const animePath = path.join(process.cwd(), "anime_pairs.json");
      const animeData = await fs.readJson(animePath);

      if (!animeData.pairs || animeData.pairs.length === 0) {
        api.setMessageReaction("❌", event.messageID, (err) => {}, true);
        return api.sendMessage("❌ لا توجد صور متاحة حالياً!", event.threadID);
      }

      // اختيار زوج عشوائي
      const randomPair = animeData.pairs[Math.floor(Math.random() * animeData.pairs.length)];

      // إرسال الصور بسرعة (بدون تحويلات)
      const message = `✨ تقطيمة أنمي عشوائية 💕\n\n👩 الأنثى:\n${randomPair.female}\n\n👨 الذكر:\n${randomPair.male}`;

      api.sendMessage(message, event.threadID);
      api.setMessageReaction("✅", event.messageID, (err) => {}, true);

    } catch (error) {
      console.error("خطأ في أمر التقطيم:", error);
      api.setMessageReaction("❌", event.messageID, (err) => {}, true);
      api.sendMessage("❌ حدث خطأ أثناء جلب الصور!", event.threadID);
    }
  }
}

export default new AnimeCommand();
