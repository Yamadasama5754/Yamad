import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class WaifuCommand {
  constructor() {
    this.name = "وايفو";
    this.author = "Kaguya Project";
    this.cooldowns = 5;
    this.description = "احصل على صورة عشوائية لشخصية أنمي جميلة 🌸";
    this.role = 0;
    this.aliases = ["وايفو", "waifu"];
  }

  async onLoad() {
    console.log("[WAIFU] تم تحضير أمر الوايفو بنجاح");
  }

  async execute({ api, event }) {
    try {
      api.setMessageReaction("🔄", event.messageID, (err) => {}, true);

      // قائمة صور الشخصيات مع الأسماء الحقيقية
      const waifuList = [
        { url: "https://cdn.waifu.im/2359.png", name: "Sakura" },
        { url: "https://i.pinimg.com/736x/58/5a/3c/585a3c1f84c8c9b3e8b9d8c7f6e5d4c3.jpg", name: "Rem" },
        { url: "https://i.pinimg.com/736x/a1/b2/c3/a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6.jpg", name: "Miku" },
        { url: "https://i.pinimg.com/736x/75/42/51/754251f8e9d0a1b2c3d4e5f6g7h8i9j0.jpg", name: "Asuna" },
        { url: "https://i.pinimg.com/736x/8f/4e/3d/8f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c.jpg", name: "Rin" },
        { url: "https://i.pinimg.com/736x/9c/b8/a7/9cb8a79687968586959485849382819b.jpg", name: "Emilia" },
        { url: "https://i.pinimg.com/736x/4c/3b/2a/4c3b2a1928374655667869798081a2b3.jpg", name: "Saber" },
        { url: "https://i.pinimg.com/736x/1f/2e/3d/1f2e3d4c5b6a7f8e9d0c1b2a3f4e5d6c.jpg", name: "Tohka" },
        { url: "https://i.pinimg.com/736x/5d/6c/7b/5d6c7b8a9f0e1d2c3b4a5f6e7d8c9b0a.jpg", name: "Mikoto" },
        { url: "https://i.pinimg.com/736x/2a/1b/0c/2a1b0c9f8e7d6c5b4a3f2e1d0c9b8a7f.jpg", name: "Haruhi" }
      ];

      const cacheDir = path.join(__dirname, "cache");
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }

      const randomWaifu = waifuList[Math.floor(Math.random() * waifuList.length)];
      const tempImagePath = path.join(cacheDir, `waifu_${Date.now()}.png`);

      try {
        api.setMessageReaction("⬇️", event.messageID, (err) => {}, true);

        // محاولة تحميل الصورة
        const https = require("https");
        const file = fs.createWriteStream(tempImagePath);

        return new Promise((resolve, reject) => {
          https.get(randomWaifu.url, (response) => {
            response.pipe(file);
            file.on("finish", () => {
              file.close();
              resolve();
            });
          }).on("error", (err) => {
            fs.unlink(tempImagePath, () => {});
            reject(err);
          });
        }).then(() => {
          const message = `✨ شخصية الأنمي: ${randomWaifu.name}\n\n🌸 جميلة جداً أليس كذلك؟`;

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
        }).catch((imgErr) => {
          console.error("[WAIFU] خطأ في تحميل الصورة:", imgErr.message);
          api.setMessageReaction("⚠️", event.messageID, (err) => {}, true);

          const message = `✨ شخصية الأنمي: ${randomWaifu.name}\n🔗 الرابط: ${randomWaifu.url}`;
          api.sendMessage(message, event.threadID, event.messageID);

          try {
            if (fs.existsSync(tempImagePath)) fs.unlinkSync(tempImagePath);
          } catch (e) {}
        });
      } catch (imgErr) {
        console.error("[WAIFU] خطأ في تحميل الصورة:", imgErr.message);
        api.setMessageReaction("❌", event.messageID, (err) => {}, true);
        api.sendMessage("❌ خطأ في تحميل الصورة. حاول مرة أخرى", event.threadID, event.messageID);

        try {
          if (fs.existsSync(tempImagePath)) fs.unlinkSync(tempImagePath);
        } catch (e) {}
      }
    } catch (error) {
      console.error("[WAIFU] خطأ:", error.message);
      api.setMessageReaction("❌", event.messageID, (err) => {}, true);
      api.sendMessage(`❌ حدث خطأ: ${error.message}`, event.threadID, event.messageID);
    }
  }
}

export default new WaifuCommand();
