import config from "../../KaguyaSetUp/config.js";
import * as translate from "@vitalets/google-translate-api";

class Translation {
  constructor() {
    this.name = "ترجمة";
    this.author = "Yamada KJ & Alastor";
    this.cooldowns = 5;
    this.description = "ترجمة نصوص إلى العربية";
    this.role = 0;
    this.aliases = ["translate"];
  }

  async execute({ api, event, args }) {
    if (!args[0]) {
      return api.sendMessage("⚠️ | لازم تكتب النص اللي تبي تترجمه.", event.threadID, event.messageID);
    }

    const text = args.join(" ");
    try {
      const res = await translate.translate(text, { to: "ar" }); // ← لاحظ هنا
      return api.sendMessage(
        `🌐 النص الأصلي:\n${text}\n\n🇸🇦 الترجمة:\n${res.text}`,
        event.threadID,
        event.messageID
      );
    } catch (err) {
      return api.sendMessage("⚠️ | حصل خطأ أثناء الترجمة:\n" + err.message, event.threadID, event.messageID);
    }
  }
}

export default new Translation();