import axios from "axios";

class PinterestCommand {
  constructor() {
    this.name = "بانترست";
    this.author = "Yamada KJ";
    this.cooldowns = 3;
    this.description = "صور من بنترست | استخدام: بانترست [كلمة البحث]";
    this.role = 0;
    this.aliases = ["بانس", "pinterest"];
  }

  async execute({ api, event, args }) {
    api.setMessageReaction("⏳", event.messageID, (err) => {}, true);

    if (!args || args.length === 0) {
      api.setMessageReaction("❌", event.messageID, (err) => {}, true);
      return api.sendMessage(
        "❌ | أدخل كلمة البحث المراد البحث عنها في بنترست.\n\n📝 مثال: .بانترست أنمي",
        event.threadID,
        event.messageID
      );
    }

    let keySearch = args.join(" ");

    try {
      api.setMessageReaction("🔍", event.messageID, (err) => {}, true);

      // البحث عن الصور
      const response = await axios.get(
        `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(keySearch)}`,
        {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
          },
          timeout: 10000
        }
      );

      // محاولة استخراج الصور من HTML
      const imageUrls = [];
      const regex = /\"image\":{\"orig\":{\"height\":\d+,\"width\":\d+,\"url\":\"([^\"]+)\"/g;
      let match;
      
      while ((match = regex.exec(response.data)) !== null) {
        imageUrls.push(match[1].replace(/\\\//g, '/'));
        if (imageUrls.length >= 5) break;
      }

      if (imageUrls.length === 0) {
        // محاولة بحث بديل
        const altResponse = await axios.get(
          `https://api.pinterest.com/v1/search/pins/?query=${encodeURIComponent(keySearch)}&access_token=test`,
          { timeout: 5000 }
        ).catch(() => null);

        if (!altResponse || altResponse.data.data.length === 0) {
          api.setMessageReaction("❌", event.messageID, (err) => {}, true);
          return api.sendMessage(
            `❌ | لم يتم العثور على صور ل "${keySearch}"`,
            event.threadID,
            event.messageID
          );
        }
      }

      if (imageUrls.length === 0) {
        api.setMessageReaction("❌", event.messageID, (err) => {}, true);
        return api.sendMessage(
          `❌ | لم يتم العثور على صور ل "${keySearch}"\n\n🔄 حاول كلمة بحث أخرى`,
          event.threadID,
          event.messageID
        );
      }

      // إرسال الصور
      const imagesToSend = imageUrls.slice(0, 5);
      
      const message = {
        attachment: imagesToSend.map((url) => ({
          type: "image",
          payload: { url: url }
        }))
      };

      api.setMessageReaction("✅", event.messageID, (err) => {}, true);
      api.sendMessage(message, event.threadID);

    } catch (err) {
      console.error("❌ Pinterest Error:", err.message);
      api.setMessageReaction("❌", event.messageID, (err) => {}, true);
      return api.sendMessage(
        `❌ | حدث خطأ: ${err.message || "خطأ غير معروف"}`,
        event.threadID,
        event.messageID
      );
    }
  }
}

export default new PinterestCommand();
