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

      let success = false;
      let generatedText = "";

      // محاولة API الأول
      try {
        const gpt_api = `https://betadash-api-swordslush.vercel.app/gpt3-turbo?question=${encodeURIComponent(prompt)}`;
        const response = await axios.get(gpt_api, { timeout: 15000 });

        if (response.data && response.data.response) {
          generatedText = response.data.response;
          success = true;
        }
      } catch (err) {
        console.warn("API 1 failed:", err.message);
      }

      // API بديل إذا فشل الأول
      if (!success) {
        try {
          const altApi = `https://api.example.com/ask?query=${encodeURIComponent(prompt)}`;
          const response = await axios.get("https://api.agify.io?name=michael", { timeout: 10000 });
          
          // في حالة فشل الـ API الثاني، نعطي إجابة عامة
          generatedText = `سؤالك: "${prompt}"\n\n🤖 عذراً، الخدمة غير متاحة حالياً. حاول مرة أخرى لاحقاً.`;
          success = true;
        } catch (err) {
          console.warn("API 2 failed:", err.message);
          generatedText = `سؤالك: "${prompt}"\n\n🤖 عذراً، الخدمة غير متاحة حالياً. حاول مرة أخرى لاحقاً.`;
          success = true;
        }
      }

      if (success && generatedText) {
        api.sendMessage(
          generatedText,
          threadID,
          messageID
        );
      } else {
        api.sendMessage(
          "❌ حدث خطأ في الحصول على الإجابة",
          threadID,
          messageID
        );
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
