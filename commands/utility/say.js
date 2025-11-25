import axios from "axios";
import fs from "fs-extra";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class Say {
  constructor() {
    this.name = "قول";
    this.author = "Yamada KJ & Alastor";
    this.cooldowns = 5;
    this.description = "تحويل النصوص إلى صوت";
    this.role = 0;
    this.aliases = ["say", "اوديو"];
  }

  async execute({ api, event, args }) {
    let text;
    let languageCode = "en";
    let hasExplicitLanguage = false;

    // Handle reply to message
    if (event.messageReply && event.messageReply.body) {
      text = event.messageReply.body;
    } else if (args && args.length > 0) {
      // Handle arguments with language code separator
      const argsStr = args.join(" ");
      if (argsStr.includes("|")) {
        const splitArgs = argsStr.split("|").map(arg => arg.trim());
        text = splitArgs[0];
        languageCode = splitArgs[1] || "en";
        hasExplicitLanguage = true;
      } else {
        text = argsStr;
      }
    }

    if (!text || text.trim() === "") {
      return api.sendMessage(
        "❌ أدخل نصاً للتحويل إلى صوت\nمثال: .قول مرحبا بك\nأو: .قول مرحبا بك | ar (إذا لم تُكتشف اللغة تلقائياً)",
        event.threadID,
        event.messageID
      );
    }

    text = text.trim();
    
    // Auto-detect language if not explicitly specified
    if (!hasExplicitLanguage) {
      // Check if text contains Arabic characters
      if (/[\u0600-\u06FF]/.test(text)) {
        languageCode = "ar";
      }
    }
    const tmpDir = `${__dirname}/tmp`;
    const path = `${tmpDir}/tts.mp3`;

    try {
      // Create tmp directory if it doesn't exist
      await fs.ensureDir(tmpDir);

      api.sendMessage(
        "⏳ جاري تحويل النص إلى صوت...",
        event.threadID
      );

      if (text.length <= 150) {
        // Single request for short text
        const response = await axios({
          method: "get",
          url: `https://translate.google.com/translate_tts?ie=UTF-8&tl=${languageCode}&client=tw-ob&q=${encodeURIComponent(text)}`,
          responseType: "stream",
          timeout: 15000
        });

        const writer = fs.createWriteStream(path);
        response.data.pipe(writer);

        await new Promise((resolve, reject) => {
          writer.on("finish", resolve);
          writer.on("error", reject);
          response.data.on("error", reject);
        });

        api.sendMessage({
          body: text,
          attachment: fs.createReadStream(path)
        }, event.threadID, () => {
          fs.remove(path).catch(err => console.error("Error removing temp file:", err));
        });
      } else {
        // Split long text into chunks and concatenate audio
        const chunkSize = 150;
        const chunks = text.match(new RegExp(`.{1,${chunkSize}}`, "g")) || [];

        for (let i = 0; i < chunks.length; i++) {
          const response = await axios({
            method: "get",
            url: `https://translate.google.com/translate_tts?ie=UTF-8&tl=${languageCode}&client=tw-ob&q=${encodeURIComponent(chunks[i])}`,
            responseType: "stream",
            timeout: 15000
          });

          const writer = fs.createWriteStream(path, { flags: i === 0 ? "w" : "a" });
          response.data.pipe(writer);

          await new Promise((resolve, reject) => {
            writer.on("finish", resolve);
            writer.on("error", reject);
            response.data.on("error", reject);
          });
        }

        api.sendMessage({
          body: text,
          attachment: fs.createReadStream(path)
        }, event.threadID, () => {
          fs.remove(path).catch(err => console.error("Error removing temp file:", err));
        });
      }
    } catch (err) {
      console.error("Say command error:", err);
      api.sendMessage(
        "❌ حدث خطأ في تحويل النص إلى صوت. جرّب مرة أخرى لاحقاً.",
        event.threadID,
        event.messageID
      );
    }
  }
}

export default new Say();
