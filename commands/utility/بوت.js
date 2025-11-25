import axios from "axios";

class BotCommand {
  constructor() {
    this.name = "بوت";
    this.author = "ZINO X MOHAMED";
    this.cooldowns = 1;
    this.description = "ذكاء اصطناعي GPT-4O متقدم | الاستخدام: بوت [سؤالك]";
    this.role = 0;
    this.aliases = ["بوت", "ai", "gpt"];
  }

  async execute({ api, event, args }) {
    try {
      const { messageID, threadID } = event;

      const stickerIDs = [
        "254596496003721",
        "254593389337365",
        "254597706003600",
        "371181363634400",
        "371180636967806",
        "2523891204552446",
        "2523889681219265",
        "2523887571219476",
        "2523890051219228"
      ];

      const randomStickerID = stickerIDs[Math.floor(Math.random() * stickerIDs.length)];

      let prompt = args.join(" ");

      if (event.messageReply) {
        const repliedMessage = event.messageReply.body;
        prompt = `${repliedMessage} ${prompt}`.trim();
      }

      if (!prompt) {
        return api.sendMessage(
          {
            body: "",
            sticker: randomStickerID
          },
          threadID,
          messageID
        );
      }

      api.sendMessage("⏳ جاري البحث...", threadID, messageID);

      try {
        const apiUrl = `https://api.joshweb.click/api/gpt-4o?q=hi&uid=${encodeURIComponent(prompt)}`;
        const response = await axios.get(apiUrl, { timeout: 15000 });

        if (response.data && response.data.result) {
          const generatedText = response.data.result;
          return api.sendMessage(
            `➪ 𝗚𝗣𝗧 🪽\n━━━━━━━━━━━━━━━━━━━\n${generatedText}\n━━━━━━━━━━━━━━━━━━━\n ＺＩＮＯ Ｘ ＭＯＨＡＭＥＤ`,
            threadID,
            messageID
          );
        } else {
          console.error("Unexpected API response:", response.data);
          return api.sendMessage(
            "❌ صيغة الرد من API غير متوقعة. حاول مرة أخرى لاحقاً.",
            threadID,
            messageID
          );
        }
      } catch (apiError) {
        console.error("API Error:", apiError.message);
        return api.sendMessage(
          `❌ حدث خطأ في الخادم. حاول مرة أخرى لاحقاً.`,
          threadID,
          messageID
        );
      }
    } catch (error) {
      console.error("❌ خطأ في أمر البوت:", error.message);
      return api.sendMessage(
        `❌ حدث خطأ. حاول مرة أخرى لاحقاً.`,
        event.threadID,
        event.messageID
      );
    }
  }
}

export default new BotCommand();
