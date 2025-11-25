import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import path from "path";

class Imagine {
  constructor() {
    this.name = "تخيلي";
    this.author = "Yamada KJ & Alastor";
    this.role = 0;
    this.version = "1.1.0";
    this.aliases = ["imagin", "flux"];
    this.description = "إنشاء فن باستخدام الذكاء الاصطناعي من وصف معطى مع إمكانية إعادة الرسم";
    this.cooldowns = 15;
  }

  async execute({ api, event, args }) {
    const { threadID, messageID, senderID } = event;

    if (!args.length) {
      api.setMessageReaction("⚙️", messageID, () => {}, true);
      return api.sendMessage(
        "⚠️ | يرجى تقديم وصف لإنشاء صورة بعد الأمر.",
        threadID
      );
    }

    const prompt = args.join(" ");
    await generateImage(api, threadID, messageID, prompt, senderID);
  }

  async onReply({ api, event, reply }) {
    const { threadID, messageID, senderID, body } = event;

    if (!reply.prompt || reply.author !== senderID) return;

    const choice = body.trim().toLowerCase();

    // إعادة توليد الصورة بنفس الوصف
    if (choice === "إعادة") {
      api.setMessageReaction("⚙️", messageID, () => {}, true);
      await generateImage(api, threadID, messageID, reply.prompt, senderID);
    }
  }
}

// ---------- دالة توليد الصورة ----------
async function generateImage(api, threadID, messageID, prompt, senderID) {
  const tempDir = path.join(process.cwd(), "cache");
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  try {
    const waitMsg = await api.sendMessage(
      "⚙️ | جـارٍ تـولـيـد وصـفـك...\n⏱️ | الرجاء الانتظار...",
      threadID
    );

    // ترجمة النص
    const translationRes = await axios.get(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=ar&tl=en&dt=t&q=${encodeURIComponent(
        prompt
      )}`
    );
    const translatedPrompt = translationRes?.data?.[0]?.[0]?.[0];

    if (!translatedPrompt)
      return api.sendMessage("❌ | حدث خطأ أثناء ترجمة النص.", threadID);

    // إنشاء الصورة
    const url = "https://ai-api.magicstudio.com/api/ai-art-generator";
    const form = new FormData();
    form.append("prompt", translatedPrompt);
    form.append("output_format", "bytes");
    form.append("user_profile_id", "null");
    form.append("anonymous_user_id", "8e79d4c4-801b-4908-858b-4afbee282b3e");
    form.append("request_timestamp", Math.floor(Date.now() / 1000));
    form.append("user_is_subscribed", "false");
    form.append("client_id", "pSgX7WgjukXCBoYwDM8G8GLnRRkvAoJlqa5eAVvj95o");

    const response = await axios.post(url, form, {
      headers: {
        ...form.getHeaders(),
        "User-Agent":
          "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36",
        Origin: "https://magicstudio.com",
        Referer: "https://magicstudio.com/ai-art-generator/",
      },
      responseType: "arraybuffer",
    });

    if (response.data) {
      const filePath = path.join(tempDir, `${Date.now()}.png`);
      fs.writeFileSync(filePath, response.data);

      api.unsendMessage(waitMsg.messageID);
      api.setMessageReaction("✔️", messageID, () => {}, true);

      api.sendMessage(
        {
          body: `✔️ | تـم تـولـيـد الـصـورة بنجاح!\n📝 | الوصف: ${prompt}\n\n✅ للـرسم مجددًا، رد بـ "إعادة".`,
          attachment: fs.createReadStream(filePath),
        },
        threadID,
        (err, info) => {
          fs.unlinkSync(filePath);
          // حفظ الوصف للرد على "إعادة"
          global.client.handler.reply.set(info.messageID, {
            author: senderID,
            prompt,
            name: "تخيلي",
          });
        },
        messageID
      );
    } else {
      api.unsendMessage(waitMsg.messageID);
      api.sendMessage("❌ | فشل في إنشاء الصورة.", threadID);
    }
  } catch (error) {
    console.error("خطأ أثناء توليد الصورة:", error);
    api.sendMessage("❌ | حدث خطأ أثناء إنشاء الصورة.", threadID);
  }
}

export default new Imagine();
