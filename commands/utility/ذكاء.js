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

      // تأخير بسيط
      await new Promise(resolve => setTimeout(resolve, 1000));

      // استدعاء API
      const gpt_api = `https://betadash-api-swordslush.vercel.app/gpt3-turbo?question=${encodeURIComponent(prompt)}`;
      const response = await axios.get(gpt_api, { timeout: 30000 });

      if (response.data && response.data.response) {
        const generatedText = response.data.response;

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
