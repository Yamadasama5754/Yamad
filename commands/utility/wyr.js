import axios from "axios";

class WYRCommand {
  constructor() {
    this.name = "لوخيروك";
    this.author = "KAGUYA PROJECT & محسّن";
    this.cooldowns = 5;
    this.description = "لعبة لو خيروك بسؤال عشوائي 🎲";
    this.role = 0;
    this.aliases = ["لوخيروك", "wyr", "خيار"];
  }

  async translateText(text) {
    try {
      const response = await axios.get(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ar&dt=t&q=${encodeURIComponent(text)}`,
        { timeout: 10000 }
      );
      return response?.data?.[0]?.[0]?.[0] || text;
    } catch (error) {
      console.warn("[WYR] خطأ في الترجمة:", error.message);
      return text; // إرجاع النص الأصلي في حالة الخطأ
    }
  }

  async execute({ api, event }) {
    try {
      api.setMessageReaction("🎲", event.messageID, () => {}, true);

      const response = await axios.get("https://api.popcat.xyz/wyr", {
        timeout: 10000
      });

      if (response.status !== 200 || !response.data || !response.data.ops1 || !response.data.ops2) {
        throw new Error("Invalid or missing response from the API");
      }

      // ترجمة الخيارات إلى العربية
      const option1 = await this.translateText(response.data.ops1);
      const option2 = await this.translateText(response.data.ops2);

      const message = `لو خيروك بين:\n\n1️⃣ ${option1}\n\n2️⃣ ${option2}`;

      api.setMessageReaction("✅", event.messageID, () => {}, true);

      api.sendMessage(
        { body: message },
        event.threadID,
        event.messageID
      );

    } catch (error) {
      console.error("[WYR] خطأ:", error.message);
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      api.sendMessage(
        "❌ حدث خطأ أثناء جلب السؤال. حاول مرة أخرى لاحقاً.",
        event.threadID,
        event.messageID
      );
    }
  }
}

export default new WYRCommand();
