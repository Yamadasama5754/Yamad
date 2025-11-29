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
        return api.sendMessage('⚠️ | يرجى توفير نص للاستفسار\n📝 مثال: .ميوكي ما هو الذكاء الاصطناعي؟', event.threadID, event.messageID);
      }

      if (!customPrompt) {
        api.setMessageReaction("❌", event.messageID, (err) => {}, true);
        return api.sendMessage('⚠️ | يرجى توفير نص للاستفسار', event.threadID, event.messageID);
      }

      api.setMessageReaction("⏳", event.messageID, (err) => {}, true);

      let apiUrl = `https://api.popcat.xyz/chatgpt?question=${encodeURIComponent(customPrompt)}`;

      const response = await axios.get(apiUrl, { timeout: 30000 });
      let aiResponse = response.data.message || response.data.response || response.data.answer;

      if (!aiResponse) {
        api.setMessageReaction("❌", event.messageID, (err) => {}, true);
        return api.sendMessage('❌ | لم يتم الحصول على رد من الذكاء الاصطناعي', event.threadID, event.messageID);
      }

      const formattedResponse = `
✨ رد الذكاء الاصطناعي
━━━━━━━━━━━━━━━━
${aiResponse.toString().trim()}
━━━━━━━━━━━━━━━━
      `;

      api.setMessageReaction("✅", event.messageID, (err) => {}, true);
      return api.sendMessage(formattedResponse.trim(), event.threadID, event.messageID);

    } catch (error) {
      console.error('[MIUKI] Error:', error.message);
      api.setMessageReaction("❌", event.messageID, (err) => {}, true);
      return api.sendMessage('❌ | حدث خطأ أثناء معالجة الطلب، يرجى المحاولة لاحقاً', event.threadID, event.messageID);
    }
  }
}

export default new Miuki();
