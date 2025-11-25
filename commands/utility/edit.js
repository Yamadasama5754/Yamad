import axios from "axios";
import fs from "fs-extra";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const API_ENDPOINT = "https://tawsif.is-a.dev/gemini/nano-banana";

function extractImageUrl(args, event) {
  let imageUrl = args.find(arg => arg.startsWith('http'));

  if (!imageUrl && event.messageReply && event.messageReply.attachments && event.messageReply.attachments.length > 0) {
    const imageAttachment = event.messageReply.attachments.find(att => att.type === 'photo' || att.type === 'image');
    if (imageAttachment && imageAttachment.url) {
      imageUrl = imageAttachment.url;
    }
  }
  return imageUrl;
}

function extractEditPrompt(rawArgs, imageUrl) {
  let prompt = rawArgs.join(" ");

  if (imageUrl) {
    prompt = prompt.replace(imageUrl, '').trim();
  }

  if (prompt.includes('|')) {
    prompt = prompt.split('|')[0].trim();
  }

  return prompt || "تحسين الجودة";
}

class EditImage {
  constructor() {
    this.name = "تعديل";
    this.author = "Yamada KJ & Alastor";
    this.cooldowns = 15;
    this.description = "تعديل أو تحسين صورة باستخدام AI";
    this.role = 0;
    this.aliases = ["تعديل", "edit", "imgedit"];
  }

  async execute({ api, event, args }) {
    const imageUrl = extractImageUrl(args, event);
    const editPrompt = extractEditPrompt(args, imageUrl);

    if (!imageUrl) {
      return api.sendMessage(
        "❌ يرجى توفير رابط صورة أو الرد على صورة لتعديلها",
        event.threadID,
        event.messageID
      );
    }

    if (!editPrompt) {
      return api.sendMessage(
        "❌ يرجى توفير وصف التعديل الذي تريده",
        event.threadID,
        event.messageID
      );
    }

    try {
      const msgReply = await api.sendMessage("⏳ جاري معالجة الصورة...", event.threadID);

      console.log(`[EDIT] Processing image with prompt: ${editPrompt}`);
      console.log(`[EDIT] Image URL: ${imageUrl}`);

      const fullApiUrl = `${API_ENDPOINT}?prompt=${encodeURIComponent(editPrompt)}&url=${encodeURIComponent(imageUrl)}`;
      
      console.log(`[EDIT] Calling API: ${fullApiUrl}`);

      const apiResponse = await axios.get(fullApiUrl, {
        timeout: 45000
      });

      const data = apiResponse.data;
      console.log(`[EDIT] API Response:`, data);

      if (!data.success) {
        throw new Error(data.error || "فشل في معالجة الصورة");
      }

      if (!data.imageUrl) {
        throw new Error("لم يتم الحصول على رابط الصورة من API");
      }

      const finalImageUrl = data.imageUrl;
      console.log(`[EDIT] Final image URL: ${finalImageUrl}`);

      // Download the edited image
      const imageDownloadResponse = await axios.get(finalImageUrl, {
        responseType: 'arraybuffer',
        timeout: 45000
      });

      const cacheDir = `${__dirname}/cache`;
      await fs.ensureDir(cacheDir);

      const tempFilePath = `${cacheDir}/edited_${Date.now()}.png`;
      await fs.writeFile(tempFilePath, imageDownloadResponse.data);
      
      console.log(`[EDIT] Image saved to: ${tempFilePath}`);

      // Send the edited image
      api.sendMessage({
        body: `✅ تم تعديل الصورة بنجاح\n📝 الطلب: ${editPrompt}`,
        attachment: fs.createReadStream(tempFilePath)
      }, event.threadID, (err) => {
        // Clean up after message is sent
        setTimeout(() => {
          try {
            if (fs.existsSync(tempFilePath)) {
              fs.unlinkSync(tempFilePath);
            }
          } catch (e) {
            console.error("[EDIT] Error cleaning temp file:", e.message);
          }
        }, 2000);
      });

      // Delete loading message
      api.unsendMessage(msgReply.messageID);

    } catch (error) {
      console.error("[EDIT] Error:", error);

      let errorMessage = "حدث خطأ أثناء تعديل الصورة";
      if (error.response) {
        console.error("[EDIT] API Response Error:", error.response.status, error.response.data);
        errorMessage = `خطأ في API: ${error.response.data?.error || error.response.status}`;
      } else if (error.message) {
        errorMessage = error.message;
      }

      return api.sendMessage(
        `❌ ${errorMessage}`,
        event.threadID,
        event.messageID
      );
    }
  }
}

export default new EditImage();
