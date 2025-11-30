import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class WaifuCommand {
  constructor() {
    this.name = "وايفو";
    this.author = "Kaguya Project";
    this.cooldowns = 5;
    this.description = "احصل على صورة عشوائية لشخصية أنمي من قاعدة بيانات عملاقة 🌸";
    this.role = 0;
    this.aliases = ["وايفو", "waifu"];
  }

  async onLoad() {
    console.log("[WAIFU] تم تحضير أمر الوايفو بنجاح");
  }

  async execute({ api, event }) {
    try {
      api.setMessageReaction("🔄", event.messageID, (err) => {}, true);

      // جلب صورة عشوائية من Waifu.im API
      const response = await axios.get("https://api.waifu.im/search?included_tags=waifu&is_nsfw=false", {
        timeout: 10000
      });

      const waifuData = response.data.images;

      if (!waifuData || waifuData.length === 0) {
        api.setMessageReaction("❌", event.messageID, (err) => {}, true);
        return api.sendMessage("❌ فشل جلب بيانات الشخصية. حاول مرة أخرى", event.threadID, event.messageID);
      }

      const waifu = waifuData[0];
      const imageUrl = waifu.url;
      const name = waifu.source ? waifu.source.split("/").pop() : "شخصية أنمي";
      const source = waifu.source || "وسيط";

      const cacheDir = path.join(__dirname, "cache");
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }

      const tempImagePath = path.join(cacheDir, `waifu_${Date.now()}.png`);

      try {
        api.setMessageReaction("⬇️", event.messageID, (err) => {}, true);

        const imageResponse = await axios.get(imageUrl, {
          responseType: "arraybuffer",
          timeout: 15000
        });

        fs.writeFileSync(tempImagePath, Buffer.from(imageResponse.data));

        const message = `✨ اسم الشخصية: ${name}\n📺 المصدر: ${source}\n\n🌸 من قاعدة بيانات تحتوي على آلاف الشخصيات`;

        api.setMessageReaction("📤", event.messageID, (err) => {}, true);

        api.sendMessage(
          {
            body: message,
            attachment: fs.createReadStream(tempImagePath)
          },
          event.threadID,
          (err, info) => {
            setTimeout(() => {
              try {
                if (fs.existsSync(tempImagePath)) {
                  fs.unlinkSync(tempImagePath);
                }
              } catch (e) {}
            }, 3000);

            api.setMessageReaction("✅", event.messageID, (err) => {}, true);
          },
          event.messageID
        );
      } catch (imgErr) {
        console.error("[WAIFU] خطأ في تحميل الصورة:", imgErr.message);
        api.setMessageReaction("⚠️", event.messageID, (err) => {}, true);

        const message = `✨ اسم الشخصية: ${name}\n📺 المصدر: ${source}\n🔗 الرابط: ${imageUrl}`;
        api.sendMessage(message, event.threadID, event.messageID);

        try {
          if (fs.existsSync(tempImagePath)) fs.unlinkSync(tempImagePath);
        } catch (e) {}
      }
    } catch (error) {
      console.error("[WAIFU] خطأ:", error.message);
      api.setMessageReaction("❌", event.messageID, (err) => {}, true);

      if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
        api.sendMessage("⏱️ انتهت مهلة الانتظار. حاول مرة أخرى", event.threadID, event.messageID);
      } else {
        api.sendMessage(`❌ حدث خطأ: ${error.message}`, event.threadID, event.messageID);
      }
    }
  }
}

export default new WaifuCommand();
