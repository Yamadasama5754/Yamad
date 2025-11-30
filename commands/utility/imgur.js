import axios from "axios";

class ImgurCommand {
  constructor() {
    this.name = "رابط";
    this.author = "Yamada KJ";
    this.cooldowns = 5;
    this.description = "رفع الصور والفيديوهات على Imgur";
    this.role = 0;
    this.aliases = ["img", "imgur", "رفع"];
  }

  async execute({ api, event }) {
    try {
      if (!event.messageReply || !event.messageReply.attachments || event.messageReply.attachments.length === 0) {
        api.setMessageReaction("❌", event.messageID, (err) => {}, true);
        return api.sendMessage(
          "🔍 يرجى الرد على صورة أو فيديو لرفعها على Imgur",
          event.threadID,
          event.messageID
        );
      }

      const attachment = event.messageReply.attachments[0];
      const fileUrl = attachment.url;

      api.setMessageReaction("⏳", event.messageID, (err) => {}, true);

      const response = await axios.post(
        "https://api.imgur.com/3/upload",
        { image: fileUrl },
        {
          headers: {
            Authorization: "Bearer 911dc78bc9cf5b7a327227fef7d53abd2585bec5",
            "Content-Type": "application/json"
          },
          timeout: 30000
        }
      );

      const imgurData = response.data.data;

      if (!imgurData.link) {
        throw new Error("لم يتم إرجاع رابط من Imgur");
      }

      api.setMessageReaction("✅", event.messageID, (err) => {}, true);

      return api.sendMessage(imgurData.link, event.threadID, event.messageID);

    } catch (error) {
      console.error("❌ خطأ في رفع الصورة على Imgur:", error.message);
      api.setMessageReaction("❌", event.messageID, (err) => {}, true);
      return api.sendMessage(
        "⚠️ حدث خطأ أثناء رفع الصورة. يرجى المحاولة لاحقاً",
        event.threadID,
        event.messageID
      );
    }
  }
}

export default new ImgurCommand();
