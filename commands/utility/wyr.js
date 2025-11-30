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

  async execute({ api, event }) {
    try {
      api.setMessageReaction("🎲", event.messageID, () => {}, true);

      const response = await axios.get("https://api.popcat.xyz/wyr", {
        timeout: 10000
      });

      if (response.status !== 200 || !response.data || !response.data.ops1 || !response.data.ops2) {
        throw new Error("Invalid or missing response from the API");
      }

      const message = `لو خيروك بين:\n\n1️⃣ ${response.data.ops1}\n\n2️⃣ ${response.data.ops2}`;

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
