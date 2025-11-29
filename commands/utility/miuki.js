import axios from 'axios';

class Miuki {
  constructor() {
    this.name = "ميوكي";
    this.author = "Chilli Mansi";
    this.role = 0;
    this.description = "يحلل صورة مرفقة أو يستجيب لاستفسار نصي باستخدام Gemini AI";
    this.cooldowns = 10;
    this.aliases = ["ai", "Ai", "ذكاء"];
  }

  async execute({ api, event, args }) {
    try {
      const attachment = event.messageReply?.attachments[0] || event.attachments[0];
      const customPrompt = args.join(' ');

      if (!customPrompt && !attachment) {
        api.setMessageReaction("❌", event.messageID, (err) => {}, true);
        return api.sendMessage('⚠️ | يرجى توفير نص أو صورة لتحليلها باستخدام Gemini AI\n📝 مثال: .ميوكي ما هذا الشيء؟', event.threadID, event.messageID);
      }

      api.setMessageReaction("⏳", event.messageID, (err) => {}, true);

      let apiUrl = '';
      let isImageRequest = false;
      
      if (attachment && attachment.type === 'photo') {
        const prompt = customPrompt || 'صف هذه الصورة بالعربية بالتفصيل';
        const imageUrl = attachment.url;
        apiUrl = `https://api.sxzz.moe/gemini?prompt=${encodeURIComponent(prompt)}&image=${encodeURIComponent(imageUrl)}`;
        isImageRequest = true;
      } else {
        if (!customPrompt) {
          api.setMessageReaction("❌", event.messageID, (err) => {}, true);
          return api.sendMessage('⚠️ | يرجى توفير نص للاستفسار', event.threadID, event.messageID);
        }
        apiUrl = `https://api.sxzz.moe/gemini?prompt=${encodeURIComponent(customPrompt)}`;
      }

      const response = await axios.get(apiUrl, { timeout: 30000 });
      let aiResponse = response.data.response || response.data.gemini || response.data.answer || response.data.text;

      if (!aiResponse) {
        api.setMessageReaction("❌", event.messageID, (err) => {}, true);
        return api.sendMessage('❌ | لم يتم الحصول على رد من Gemini AI', event.threadID, event.messageID);
      }

      const formattedResponse = `
✨ رد Gemini AI
━━━━━━━━━━━━━━━━
${aiResponse.trim()}
━━━━━━━━━━━━━━━━
      `;

      api.setMessageReaction("✅", event.messageID, (err) => {}, true);
      return api.sendMessage(formattedResponse.trim(), event.threadID, event.messageID);

    } catch (error) {
      console.error('[MIUKI] Error:', error.message);
      api.setMessageReaction("❌", event.messageID, (err) => {}, true);
      return api.sendMessage('❌ | حدث خطأ أثناء معالجة الطلب، يرجى المحاولة لاحقاً\n' + error.message, event.threadID, event.messageID);
    }
  }
}

export default new Miuki();
