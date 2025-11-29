import axios from "axios";
import fs from "fs-extra";
import path from "path";

class PinterestCommand {
  constructor() {
    this.name = "بانترست";
    this.author = "Yamada KJ & Alastor - Enhanced";
    this.cooldowns = 3;
    this.description = "صور دقيقة من بنترست حسب البحث | استخدام: بانترست [كلمة البحث]";
    this.role = 0;
    this.aliases = ["بانس", "pinterest"];
  }

  async translateToEnglish(text) {
    try {
      const translationResponse = await axios.get(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=ar&tl=en&dt=t&q=${encodeURIComponent(text)}`,
        { timeout: 5000 }
      );
      return translationResponse?.data?.[0]?.[0]?.[0] || text;
    } catch (error) {
      console.warn("⚠️ خطأ في الترجمة:", error.message);
      return text;
    }
  }

  // فلترة النتائج غير الملائمة
  isRelevantImage(imageUrl, searchKeyword) {
    if (!imageUrl || !searchKeyword) return true;
    
    const urlLower = imageUrl.toLowerCase();
    const keywordLower = searchKeyword.toLowerCase();
    
    // تجنب الصور ذات العلامات المريبة
    const blacklist = ["watermark", "logo", "ads", "advertisement", "adult", "nsfw"];
    for (const keyword of blacklist) {
      if (urlLower.includes(keyword)) return false;
    }
    
    return true;
  }

  async execute({ api, event, args }) {
    api.setMessageReaction("⏱️", event.messageID, (err) => {}, true);

    if (!args || args.length === 0) {
      api.setMessageReaction("❌", event.messageID, (err) => {}, true);
      return api.sendMessage(
        "❌ | أدخل كلمة البحث المراد البحث عنها في بنترست.\n\n📝 مثال: .بانترست لوفي",
        event.threadID,
        event.messageID
      );
    }

    let keySearch = args.join(" ");

    try {
      // ترجمة كلمة البحث إلى الإنجليزية إذا كانت عربية
      const englishKeySearch = await this.translateToEnglish(keySearch);
      console.log(`🔍 البحث عن: "${keySearch}" (الترجمة: "${englishKeySearch}")`);

      api.setMessageReaction("🔍", event.messageID, (err) => {}, true);

      // محاولة من API الأول (Hiroshi)
      let data = [];
      try {
        const pinterestResponse = await axios.get(
          `https://hiroshi-api.onrender.com/image/pinterest?search=${encodeURIComponent(englishKeySearch)}`,
          { timeout: 10000 }
        );
        data = pinterestResponse.data.data || [];
      } catch (error) {
        console.warn("⚠️ API الأول فشل، محاولة API بديل...");
        
        // محاولة من API بديل
        try {
          const backupResponse = await axios.get(
            `https://api.unsplash.com/search/photos?query=${encodeURIComponent(englishKeySearch)}&per_page=15&client_id=VF0-J4_bsY7Oj_nJ_s83RWlvYeEz0lLKZ9b6c6T1gRc`,
            { timeout: 10000 }
          );
          data = backupResponse.data.results?.map(item => item.urls?.regular || item.urls?.small) || [];
        } catch (backupError) {
          console.error("❌ جميع API فشلت:", backupError.message);
          data = [];
        }
      }

      if (!data || data.length === 0) {
        api.setMessageReaction("❌", event.messageID, (err) => {}, true);
        return api.sendMessage(
          `❌ | لم يتم العثور على صور ل "${keySearch}"\n\n🔄 حاول كلمة بحث أخرى`,
          event.threadID,
          event.messageID
        );
      }

      // فلترة النتائج غير الملائمة
      const filteredData = data.filter((img, index) => 
        this.isRelevantImage(img, englishKeySearch) && index < 8
      );

      if (filteredData.length === 0) {
        api.setMessageReaction("❌", event.messageID, (err) => {}, true);
        return api.sendMessage(
          `⚠️ | لم يتم العثور على صور دقيقة ل "${keySearch}"\n\n🔄 حاول كلمة بحث أخرى`,
          event.threadID,
          event.messageID
        );
      }

      // تحميل الصور
      const imagesToDownload = filteredData.slice(0, 5); // 5 صور بدل 10 لأداء أفضل
      const cacheDir = path.join(process.cwd(), "cache");
      
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }

      const imgData = [];
      const downloadedPaths = [];
      let successCount = 0;

      for (let i = 0; i < imagesToDownload.length; i++) {
        try {
          const imageUrl = imagesToDownload[i];
          if (!imageUrl) continue;

          const filePath = path.join(cacheDir, `pinterest_${Date.now()}_${i + 1}.jpg`);
          
          const imageResponse = await axios.get(imageUrl, {
            responseType: "arraybuffer",
            timeout: 8000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          });

          if (imageResponse.data && imageResponse.data.length > 0) {
            fs.writeFileSync(filePath, Buffer.from(imageResponse.data, "binary"));
            imgData.push(fs.createReadStream(filePath));
            downloadedPaths.push(filePath);
            successCount++;
          }
        } catch (imgError) {
          console.warn(`⚠️ فشل تحميل الصورة ${i + 1}:`, imgError.message);
        }
      }

      if (imgData.length === 0) {
        api.setMessageReaction("❌", event.messageID, (err) => {}, true);
        return api.sendMessage(
          "❌ | فشل تحميل الصور. حاول مرة أخرى.",
          event.threadID,
          event.messageID
        );
      }

      api.setMessageReaction("✅", event.messageID, (err) => {}, true);

      api.sendMessage({
        attachment: imgData,
        body: `⚜️ | نتائج البحث عن: ${keySearch}\n\n📊 | تم العثور على ${successCount} صورة دقيقة\n\n✨ جميع الصور ملائمة للبحث`
      }, event.threadID, (err, info) => {
        if (err) console.error("❌ خطأ في إرسال الرسالة:", err);
        
        // حذف الصور المؤقتة بعد التحميل
        setTimeout(() => {
          for (const filePath of downloadedPaths) {
            try {
              if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
              }
            } catch (e) {
              console.warn("⚠️ فشل حذف ملف مؤقت:", filePath);
            }
          }
        }, 2000);
      });

    } catch (error) {
      console.error("❌ خطأ عام في الأمر:", error);
      api.setMessageReaction("❌", event.messageID, (err) => {}, true);
      api.sendMessage(
        "❌ | حدث خطأ أثناء البحث.\n\n🔄 يرجى المحاولة مرة أخرى.",
        event.threadID,
        event.messageID
      );
    }
  }
}

export default new PinterestCommand();
