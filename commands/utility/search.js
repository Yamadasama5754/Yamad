import axios from "axios";

class SearchCommand {
  constructor() {
    this.name = "بحث";
    this.author = "S H A D O W";
    this.cooldowns = 1;
    this.description = "ابحث عن كل ما تريد معرفته من خلال ويكيبيديا 🔍";
    this.role = 0;
    this.aliases = ["بحث", "ويكيبيديا", "search"];
  }

  async onLoad() {
    console.log("[SEARCH] تم تحضير أمر البحث بنجاح");
  }

  async execute({ api, event, args }) {
    try {
      api.setMessageReaction("🔍", event.messageID, (err) => {}, true);

      let content = args.join(" ");
      let isEnglish = false;

      // التحقق من اللغة
      if (args[0] && args[0].toLowerCase() === "en") {
        isEnglish = true;
        content = args.slice(1).join(" ");
      }

      if (!content) {
        api.setMessageReaction("❌", event.messageID, (err) => {}, true);
        return api.sendMessage(
          "⚠️ | ادخل ما تريد البحث عنه\n💡 مثال: .بحث أنشتاين\n💡 للإنجليزية: .بحث en Einstein",
          event.threadID,
          event.messageID
        );
      }

      api.setMessageReaction("⏱️", event.messageID, (err) => {}, true);

      const url = isEnglish 
        ? 'https://en.wikipedia.org/w/api.php'
        : 'https://ar.wikipedia.org/w/api.php';

      // البحث الدقيق
      try {
        const response = await axios.get(url, {
          params: {
            action: 'query',
            format: 'json',
            srsearch: content,
            srwhat: 'text',
            srlimit: 1,
            list: 'search'
          },
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          timeout: 15000
        });

        const searchResults = response.data.query.search;

        if (!searchResults || searchResults.length === 0) {
          api.setMessageReaction("❌", event.messageID, (err) => {}, true);
          return api.sendMessage(
            `❌ لم أستطع إيجاد: "${content}"`,
            event.threadID,
            event.messageID
          );
        }

        const pageTitle = searchResults[0].title;

        // الحصول على النص الكامل للصفحة
        const pageResponse = await axios.get(url, {
          params: {
            action: 'query',
            format: 'json',
            titles: pageTitle,
            prop: 'extracts',
            explaintext: true,
            exsectionformat: 'wiki'
          },
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          timeout: 15000
        });

        const pages = pageResponse.data.query.pages;
        const pageId = Object.keys(pages)[0];
        let summary = pages[pageId].extract;

        // قص النص إلى 2000 حرف
        if (summary.length > 2000) {
          summary = summary.substring(0, 2000) + "...\n\n📖 لمزيد من المعلومات، ابحث على ويكيبيديا مباشرة";
        }

        const finalMessage = `📚 ${pageTitle}\n\n${summary}`;

        api.setMessageReaction("✅", event.messageID, (err) => {}, true);

        api.sendMessage(
          finalMessage,
          event.threadID,
          (err, info) => {},
          event.messageID
        );

      } catch (err) {
        console.error("[SEARCH] خطأ في البحث:", err.message);
        api.setMessageReaction("❌", event.messageID, (err) => {}, true);
        api.sendMessage(
          `❌ حدث خطأ أثناء البحث: ${err.message}`,
          event.threadID,
          event.messageID
        );
      }

    } catch (error) {
      console.error("[SEARCH] خطأ:", error);
      api.setMessageReaction("❌", event.messageID, (err) => {}, true);
      api.sendMessage(
        `❌ حدث خطأ: ${error.message}`,
        event.threadID,
        event.messageID
      );
    }
  }
}

export default new SearchCommand();
