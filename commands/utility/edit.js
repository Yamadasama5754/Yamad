import axios from "axios";
import fs from "fs-extra";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// خوادم بديلة موثوقة
const API_ENDPOINTS = [
  "https://tawsif.is-a.dev/gemini/nano-banana",
  "https://api.imgbb.com/1/upload" // خيار بديل
];

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
    this.cooldowns = 20;
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

      let editedImageUrl = null;
      let lastError = null;

      // محاولة من أول خادم
      for (let endpoint of API_ENDPOINTS) {
        try {
          console.log(`[EDIT] Trying endpoint: ${endpoint}`);
          
          const fullApiUrl = `${endpoint}?prompt=${encodeURIComponent(editPrompt)}&url=${encodeURIComponent(imageUrl)}`;
          
          const apiResponse = await axios.get(fullApiUrl, {
            timeout: 60000
          });

          const data = apiResponse.data;
          console.log(`[EDIT] Response:`, data);

          if (data.success && data.imageUrl) {
            editedImageUrl = data.imageUrl;
            break;
          } else if (data.imageUrl) {
            editedImageUrl = data.imageUrl;
            break;
          }
        } catch (err) {
          console.error(`[EDIT] Endpoint failed: ${endpoint}`, err.message);
          lastError = err;
          continue;
        }
      }

      if (!editedImageUrl) {
        throw new Error(lastError?.message || "فشل في معالجة الصورة من جميع الخوادم");
      }

      console.log(`[EDIT] Final image URL: ${editedImageUrl}`);

      // تحميل الصورة المعدلة
      const imageDownloadResponse = await axios.get(editedImageUrl, {
        responseType: 'arraybuffer',
        timeout: 60000
      });

      const cacheDir = `${__dirname}/cache`;
      await fs.ensureDir(cacheDir);

      const tempFilePath = `${cacheDir}/edited_${Date.now()}.png`;
      await fs.writeFile(tempFilePath, imageDownloadResponse.data);
      
      console.log(`[EDIT] Image saved to: ${tempFilePath}`);

      // إرسال الصورة المعدلة
      api.sendMessage({
        body: `✅ تم تعديل الصورة بنجاح\n📝 الطلب: ${editPrompt}`,
        attachment: fs.createReadStream(tempFilePath)
      }, event.threadID, (err) => {
        // حذف الملف بعد الإرسال
        setTimeout(() => {
          try {
            if (fs.existsSync(tempFilePath)) {
              fs.unlinkSync(tempFilePath);
            }
          } catch (e) {
            console.error("[EDIT] Error cleaning temp file:", e.message);
          }
        }, 3000);
      });

      // حذف رسالة التحميل
      try {
        api.unsendMessage(msgReply.messageID);
      } catch (e) {
        console.error("[EDIT] Error unsending message:", e.message);
      }

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
