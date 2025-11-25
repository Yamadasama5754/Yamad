import axios from "axios";
import config from "../../KaguyaSetUp/config.js";

class SetAvatar {
  constructor() {
    this.name = "بروفايلك";
    this.author = "Yamada KJ & Alastor";
    this.cooldowns = 5;
    this.description = "تغيير صورة ملف تعريف البوت";
    this.role = 2;
    this.aliases = ["بروفايلك", "ppf"];
  }

  async execute({ api, event, args }) {
    try {
      let imageURL = (args[0] || "").startsWith("http") ? args.shift() : null;
      
      if (!imageURL) {
        // الرد على صورة
        if (event.messageReply && event.messageReply.attachments && event.messageReply.attachments.length > 0) {
          imageURL = event.messageReply.attachments[0].url;
        }
        // أو إرسال صورة مع الأمر
        else if (event.attachments && event.attachments.length > 0) {
          imageURL = event.attachments[0].url;
        }
      }

      if (!imageURL) {
        return api.sendMessage(
          "❌ يجب تزويد رابط صورة أو إرسال صورة مع الأمر",
          event.threadID,
          event.messageID
        );
      }

      const expirationAfter = !isNaN(args[args.length - 1]) ? args.pop() : null;
      const caption = args.join(" ") || "";

      let response;
      try {
        response = await axios.get(imageURL, {
          responseType: "stream",
          timeout: 10000
        });
      } catch (err) {
        return api.sendMessage(
          "❌ حدث خطأ أثناء جلب الصورة من الرابط",
          event.threadID,
          event.messageID
        );
      }

      if (!response.headers["content-type"] || !response.headers["content-type"].includes("image")) {
        return api.sendMessage(
          "❌ صيغة الصورة غير صحيحة",
          event.threadID,
          event.messageID
        );
      }

      response.data.path = "avatar.jpg";

      api.changeAvatar(response.data, caption, expirationAfter ? expirationAfter * 1000 : null, (err) => {
        if (err) {
          console.error("Error changing avatar:", err);
          return api.sendMessage(
            `❌ خطأ: ${err.message}`,
            event.threadID,
            event.messageID
          );
        }
        return api.sendMessage(
          "✓ تم تغيير صورة ملف التعريف بنجاح",
          event.threadID
        );
      });

    } catch (err) {
      console.error("SetAvatar error:", err);
      api.sendMessage(
        `❌ حدثت مشكلة: ${err.message}`,
        event.threadID,
        event.messageID
      );
    }
  }
}

export default new SetAvatar();
