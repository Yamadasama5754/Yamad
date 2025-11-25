import fs from "fs-extra";
import axios from "axios";
import path from "path";

class MergeEmojiCommand {
  constructor() {
    this.name = "دمج";
    this.author = "Yamada KJ & Alastor";
    this.cooldowns = 5;
    this.description = "قم بدمج إثنان من الإيموجي | الاستخدام: دمج 😀 | 😂";
    this.role = 0;
    this.aliases = ["دمج"];
  }

  async execute({ api, event, args }) {
    const { threadID, messageID } = event;

    try {
      if (!args[0]) {
        return api.sendMessage(
          `❌ صيغة خاطئة!\nالاستخدام: دمج [إيموجي1 | إيموجي2]`,
          threadID,
          messageID
        );
      }

      const content = args.join(" ").split("|").map(item => item.trim());
      
      if (!content[0] || !content[1]) {
        return api.sendMessage(
          `❌ يجب تحديد إيموجيين!\nالاستخدام: دمج 😀 | 😂`,
          threadID,
          messageID
        );
      }

      const emoji1 = encodeURIComponent(content[0]);
      const emoji2 = encodeURIComponent(content[1]);

      // Fetch the merged emoji image
      const response = await axios.get(
        `https://smfahim.xyz/emojimix?one=${emoji1}&two=${emoji2}`,
        { timeout: 10000 }
      );

      if (!response.data.results || response.data.results.length === 0) {
        return api.sendMessage(
          "❌ لم أتمكن من دمج هذه الإيموجيات. تأكد من صحة الإيموجيات.",
          threadID,
          messageID
        );
      }

      const imageUrl = response.data.results[0].media_formats.png_transparent.url;

      const cacheDir = path.join(process.cwd(), "cache");
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }

      const filePath = path.join(cacheDir, `merged_emoji_${Date.now()}.png`);
      const writer = fs.createWriteStream(filePath);

      const imageResponse = await axios({
        method: "get",
        url: imageUrl,
        responseType: "stream",
        timeout: 30000
      });

      imageResponse.data.pipe(writer);

      writer.on("finish", () => {
        api.setMessageReaction("✅", event.messageID, () => {}, true);
        
        api.sendMessage(
          { 
            body: `✅ تــم الدمـج بـنـجـاح`,
            attachment: fs.createReadStream(filePath)
          },
          threadID,
          () => {
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
          },
          messageID
        );
      });

      writer.on("error", (error) => {
        console.error("خطأ في كتابة الملف:", error);
        api.sendMessage("❌ حدث خطأ أثناء حفظ الصورة.", threadID, messageID);
      });

    } catch (error) {
      console.error("Error in merge emoji:", error.message);
      api.sendMessage(
        "❌ حدث خطأ أثناء دمج الإيموجيات.",
        threadID,
        messageID
      );
    }
  }
}

export default new MergeEmojiCommand();
