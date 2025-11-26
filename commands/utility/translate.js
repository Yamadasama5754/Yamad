import { translate } from "@vitalets/google-translate-api";

class TranslateCommand {
  constructor() {
    this.name = "ترجمة";
    this.author = "Yamada KJ & Alastor";
    this.cooldowns = 3;
    this.description = "ترجمة النصوص - ترجمة [لغة] [نص] أو رد على رسالة وقل الأمر";
    this.role = 0;
    this.aliases = ["translate", "ترجم"];
  }

  // خريطة اللغات المدعومة
  getLangCode(langName) {
    const languages = {
      "عربية": "ar",
      "english": "en",
      "فرنسية": "fr",
      "الإنجليزية": "en",
      "الفرنسية": "fr",
      "إسباني": "es",
      "Spanish": "es",
      "French": "fr",
      "English": "en",
      "Arabic": "ar"
    };
    return languages[langName?.toLowerCase()] || "ar"; // العربية افتراضية
  }

  async execute({ api, event, args }) {
    try {
      api.setMessageReaction("⏳", event.messageID, (err) => {}, true);

      let textToTranslate = "";
      let targetLang = "ar"; // افتراضي: العربية

      // حالة 1: الرد على رسالة
      if (event.messageReply) {
        textToTranslate = event.messageReply.body;
        targetLang = this.getLangCode(args[0]) || "ar";
      }
      // حالة 2: لا توجد معاملات
      else if (args.length === 0) {
        api.setMessageReaction("❌", event.messageID, (err) => {}, true);
        return api.sendMessage(
          "❌ استخدم الأمر بشكل صحيح:\n" +
          ".ترجمة [لغة] [النص]\n" +
          "مثال: .ترجمة عربية Hello world\n\n" +
          "أو رد على رسالة وقل: .ترجمة عربية",
          event.threadID
        );
      }
      // حالة 3: أول معامل هو اللغة
      else if (this.getLangCode(args[0]) && args.length > 1) {
        targetLang = this.getLangCode(args[0]);
        textToTranslate = args.slice(1).join(" ");
      }
      // حالة 4: بدون تحديد لغة (افتراضي عربي)
      else {
        textToTranslate = args.join(" ");
        targetLang = "ar";
      }

      if (!textToTranslate.trim()) {
        api.setMessageReaction("❌", event.messageID, (err) => {}, true);
        return api.sendMessage("❌ يجب تحديد نص للترجمة!", event.threadID);
      }

      // ترجمة النص
      const result = await translate(textToTranslate, { to: targetLang });
      const translatedText = result.text;

      // تحديد اسم اللغة
      const langNames = {
        "ar": "🇸🇦 العربية",
        "en": "🇺🇸 الإنجليزية",
        "fr": "🇫🇷 الفرنسية",
        "es": "🇪🇸 الإسبانية",
        "de": "🇩🇪 الألمانية",
        "ja": "🇯🇵 اليابانية",
        "zh": "🇨🇳 الصينية"
      };

      const langDisplay = langNames[targetLang] || "لغة مختارة";

      const message = `📝 ترجمة إلى ${langDisplay}:\n\n${translatedText}`;
      api.sendMessage(message, event.threadID);
      api.setMessageReaction("✅", event.messageID, (err) => {}, true);

    } catch (error) {
      console.error("خطأ في الترجمة:", error);
      api.setMessageReaction("❌", event.messageID, (err) => {}, true);
      api.sendMessage("❌ حدث خطأ أثناء الترجمة!", event.threadID);
    }
  }

  async onReply({ api, event, reply }) {
    try {
      const textToTranslate = event.body?.trim();
      
      if (!textToTranslate) {
        return api.sendMessage("❌ يجب إدخال النص!", event.threadID);
      }

      const args = textToTranslate.split(/\s+/);
      const targetLang = this.getLangCode(args[0]) || "ar";

      api.setMessageReaction("⏳", event.messageID, (err) => {}, true);

      const result = await translate(reply.textToTranslate, { to: targetLang });
      const translatedText = result.text;

      const langNames = {
        "ar": "🇸🇦 العربية",
        "en": "🇺🇸 الإنجليزية",
        "fr": "🇫🇷 الفرنسية",
        "es": "🇪🇸 الإسبانية",
        "de": "🇩🇪 الألمانية",
        "ja": "🇯🇵 اليابانية",
        "zh": "🇨🇳 الصينية"
      };

      const langDisplay = langNames[targetLang] || "لغة مختارة";
      const message = `📝 ترجمة إلى ${langDisplay}:\n\n${translatedText}`;
      
      api.sendMessage(message, event.threadID);
      api.setMessageReaction("✅", event.messageID, (err) => {}, true);

    } catch (error) {
      console.error("خطأ في الترجمة:", error);
      api.setMessageReaction("❌", event.messageID, (err) => {}, true);
      api.sendMessage("❌ حدث خطأ أثناء الترجمة!", event.threadID);
    }
  }
}

export default new TranslateCommand();
