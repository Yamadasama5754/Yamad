import axios from "axios";
import fs from "fs-extra";
import path from "path";

class PinterestCommand {
  constructor() {
    this.name = "بانترست";
    this.author = "Yamada KJ & Alastor";
    this.cooldowns = 3;
    this.description = "صور من بنترست";
    this.role = 0;
    this.aliases = ["بانس"];
  }

  async translateToEnglish(text) {
    try {
      const translationResponse = await axios.get(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=ar&tl=en&dt=t&q=${encodeURIComponent(text)}`
      );
      return translationResponse?.data?.[0]?.[0]?.[0];
    } catch (error) {
      console.error("خطأ في الترجمة:", error);
      return text;
    }
  }

  async execute({ api, event, args }) {
    api.setMessageReaction("⏱️", event.messageID, (err) => {}, true);

    if (!args || args.length === 0) {
      api.setMessageReaction("❌", event.messageID, (err) => {}, true);
      return api.sendMessage("❌ | أدخل كلمة البحث المراد البحث عنه في بنترست.\n\n📝 مثال: .صور القطط", event.threadID, event.messageID);
    }

    let keySearch = args.join(" ");

    try {
      // ترجمة كلمة البحث إلى الإنجليزية إذا كانت عربية
      keySearch = await this.translateToEnglish(keySearch);

      const pinterestResponse = await axios.get(
        `https://hiroshi-api.onrender.com/image/pinterest?search=${encodeURIComponent(keySearch)}`,
        { timeout: 15000 }
      );

      const data = pinterestResponse.data.data;

      if (!data || data.length === 0) {
        api.setMessageReaction("❌", event.messageID, (err) => {}, true);
        return api.sendMessage(`❌ | لم يتم العثور على صور ل "${keySearch}"`, event.threadID, event.messageID);
      }

      // الحد الأقصى 10 صور
      const imagesToDownload = data.slice(0, 10);
      const cacheDir = path.join(process.cwd(), "cache");

      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }

      const imgData = [];
      const downloadedPaths = [];

      for (let i = 0; i < imagesToDownload.length; i++) {
        try {
          const filePath = path.join(cacheDir, `pinterest_${Date.now()}_${i + 1}.jpg`);
          const imageResponse = await axios.get(imagesToDownload[i], {
            responseType: "arraybuffer",
            timeout: 10000
          });
          fs.writeFileSync(filePath, Buffer.from(imageResponse.data, "binary"));
          imgData.push(fs.createReadStream(filePath));
          downloadedPaths.push(filePath);
        } catch (imgError) {
          console.error(`فشل تحميل الصورة ${i + 1}:`, imgError);
        }
      }

      if (imgData.length === 0) {
        api.setMessageReaction("❌", event.messageID, (err) => {}, true);
        return api.sendMessage("❌ | فشل تحميل الصور. حاول مرة أخرى.", event.threadID, event.messageID);
      }

      api.setMessageReaction("✅", event.messageID, (err) => {}, true);

      api.sendMessage({
        attachment: imgData,
        body: `⚜️ | نتائج البحث عن: ${keySearch}\n\n📊 | تم العثور على ${imgData.length} صورة`
      }, event.threadID, (err, info) => {
        if (err) console.error("خطأ في إرسال الرسالة:", err);
        // حذف الصور المؤقتة
        for (const filePath of downloadedPaths) {
          setTimeout(() => {
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
          }, 1000);
        }
      });

    } catch (error) {
      console.error("خطأ في جلب الصور:", error);
      api.setMessageReaction("❌", event.messageID, (err) => {}, true);
      api.sendMessage("❌ | حدث خطأ أثناء جلب الصور. يرجى المحاولة مرة أخرى.", event.threadID, event.messageID);
    }
  }
}

export default new PinterestCommand();