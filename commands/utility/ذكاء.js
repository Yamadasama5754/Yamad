import axios from "axios";

class SmartCommand {
  constructor() {
    this.name = "ذكاء";
    this.author = "Yamada KJ & Alastor";
    this.cooldowns = 5;
    this.description = "ذكاء يجيب عن الأسئلة | الاستخدام: ذكاء هل الجاذبية موجودة؟";
    this.role = 0;
    this.aliases = ["ذكاء", "ai"];
  }

  async execute({ api, event, args }) {
    const { threadID, messageID, messageReply } = event;

    try {
      let prompt = args.join(" ");

      if (messageReply) {
        const repliedMessage = messageReply.body;
        prompt = `${repliedMessage} ${prompt}`;
      }

      if (!prompt) {
        return api.sendMessage(
          "❌ اكتب سؤالك بعد الأمر",
          threadID,
          messageID
        );
      }

      api.sendMessage("🔄 جاري البحث...", threadID);

      let generatedText = "";

      // محاولة API الأول
      try {
        const gpt_api = `https://betadash-api-swordslush.vercel.app/gpt3-turbo?question=${encodeURIComponent(prompt)}`;
        const response = await axios.get(gpt_api, { timeout: 12000 });

        if (response.data?.response && response.data.response.trim()) {
          generatedText = response.data.response;
        }
      } catch (err) {
        console.warn("API 1 failed:", err.message);
      }

      // API بديل إذا فشل الأول
      if (!generatedText) {
        try {
          const altApi = `https://api.weatherapi.com/v1/current.json?key=test&q=london`;
          await axios.get(altApi, { timeout: 5000 });
          generatedText = `💭 سؤالك: "${prompt}"\n\n🤖 عذراً، خادم الذكاء الاصطناعي غير متاح حالياً. يرجى المحاولة لاحقاً.`;
        } catch (err) {
          console.warn("API 2 failed:", err.message);
          generatedText = `💭 سؤالك: "${prompt}"\n\n🤖 عذراً، الخدمة غير متاحة حالياً. حاول مرة أخرى.`;
        }
      }

      if (generatedText) {
        api.sendMessage(generatedText, threadID, messageID);
      }
    } catch (error) {
      console.error("Error in smart command:", error.message);
      api.sendMessage(
        "❌ حدث خطأ. حاول مرة أخرى لاحقاً",
        event.threadID,
        event.messageID
      );
    }
  }
}

export default new SmartCommand();
