import fs from "fs-extra";
import path from "path";
import axios from "axios";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

      // إنشاء مجلد cache إذا لم يكن موجوداً
      const cacheDir = path.join(process.cwd(), "cache");
      await fs.ensureDir(cacheDir);

      // تحميل الصور من الروابط
      try {
        const femaleResponse = await axios.get(randomPair.female, { responseType: "arraybuffer", timeout: 15000 });
        const maleResponse = await axios.get(randomPair.male, { responseType: "arraybuffer", timeout: 15000 });

        // حفظ الصور مؤقتاً
        const femalePath = path.join(cacheDir, `anime_female_${Date.now()}.jpg`);
        const malePath = path.join(cacheDir, `anime_male_${Date.now()}.jpg`);

        await fs.writeFile(femalePath, femaleResponse.data);
        await fs.writeFile(malePath, maleResponse.data);

        // إرسال الصورتين معاً
        api.sendMessage(
          {
            body: "✨ تقطيمة أنمي عشوائية 💕\n\n👩 الأنثى | 👨 الذكر",
            attachment: [
              fs.createReadStream(femalePath),
              fs.createReadStream(malePath)
            ]
          },
          event.threadID,
          () => {
            // تنظيف الملفات المؤقتة
            setTimeout(() => {
              fs.remove(femalePath).catch(() => {});
              fs.remove(malePath).catch(() => {});
            }, 2000);
          }
        );

        api.setMessageReaction("✅", event.messageID, (err) => {}, true);

      } catch (downloadErr) {
        console.error("خطأ في تحميل الصور:", downloadErr.message);
        api.setMessageReaction("⚠️", event.messageID, (err) => {}, true);
        api.sendMessage("⚠️ حدث خطأ في تحميل الصور، حاول لاحقاً!", event.threadID);
      }

    } catch (error) {
      console.error("خطأ في أمر التقطيم:", error);
      api.setMessageReaction("❌", event.messageID, (err) => {}, true);
      api.sendMessage("❌ حدث خطأ أثناء جلب الصور!", event.threadID);
    }
  }
}

export default new AnimeCommand();
