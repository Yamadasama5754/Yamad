import axios from 'axios';

const piVoiceModels = {
  1: "بي 1 ✨",
  2: "بي 2 ✨",
  3: "بي 3 ✨",
  4: "بي 4",
  5: "بي 5",
  6: "بي 6",
  7: "بي 7",
  8: "بي 8"
};

class PiCommand {
  constructor() {
    this.name = "بي";
    this.author = "Tanvir - تُرجم بواسطة عمر";
    this.cooldowns = 5;
    this.description = "محادثة مع ذكاء بي AI مع دعم الصوت والنصوص 🤖";
    this.role = 0;
    this.aliases = ["pi", "chat"];
  }

  async execute({ api, event, args, Users }) {
    try {
      const threadID = event.threadID;
      const senderID = event.senderID;
      const input = args.join(" ").trim();

      if (!input) {
        return api.sendMessage(
          "❌ | أرسل رسالة أو استخدم:\n" +
          "🔊 .بي ضبط_الصوت on|off|1-8\n" +
          "📋 .بي قائمة\n" +
          "💬 .بي رسالتك هنا",
          threadID,
          event.messageID
        );
      }

      let voiceSetting = await this.getUserVoiceSetting(senderID);

      // معالجة أوامر ضبط الصوت
      if (input.toLowerCase().startsWith("ضبط_الصوت") || input.toLowerCase().startsWith("setvoice")) {
        return this.handleVoiceSettings(api, threadID, event.messageID, senderID, input, voiceSetting);
      }

      // عرض قائمة النماذج
      if (input.toLowerCase() === "قائمة" || input.toLowerCase() === "list") {
        return this.handleListCommand(api, threadID, event.messageID, senderID, voiceSetting);
      }

      // محادثة عادية
      const session = `pi-${senderID}`;
      try {
        const res = await this.callPi(input, session, voiceSetting.voice, voiceSetting.model);
        
        if (!res?.text) {
          return api.sendMessage("❌ | بي لم يرد على رسالتك", threadID, event.messageID);
        }

        const replyPayload = {
          body: `🤖 بي: ${res.text}`
        };

        return api.sendMessage(replyPayload, threadID, (err, info) => {
          if (!err) {
            this.saveReplyHandler(info.messageID, senderID, session, voiceSetting);
          }
        });

      } catch (err) {
        return api.sendMessage("⚠️ | فشل الاتصال بـ بي: " + err.message, threadID, event.messageID);
      }

    } catch (error) {
      console.error("[PI Command Error]", error);
      return api.sendMessage("❌ | حدث خطأ: " + error.message, event.threadID, event.messageID);
    }
  }

  async onReply({ api, event, Reply, args, Users }) {
    try {
      const threadID = event.threadID;
      const senderID = event.senderID;
      const query = event.body?.trim();

      if (!query) return;
      if (senderID !== Reply.author) return;

      let voiceSetting = await this.getUserVoiceSetting(senderID);
      const session = Reply.session || `pi-${senderID}`;

      try {
        const res = await this.callPi(query, session, voiceSetting.voice, voiceSetting.model);

        if (!res?.text) {
          return api.sendMessage("❌ | بي لم يرد على رسالتك", threadID);
        }

        const replyPayload = {
          body: `🤖 بي: ${res.text}`
        };

        return api.sendMessage(replyPayload, threadID, (err, info) => {
          if (!err) {
            this.saveReplyHandler(info.messageID, senderID, session, voiceSetting);
          }
        });

      } catch (err) {
        return api.sendMessage("⚠️ | فشل الاتصال بـ بي: " + err.message, threadID);
      }

    } catch (error) {
      console.error("[PI Reply Error]", error);
      return api.sendMessage("❌ | حدث خطأ: " + error.message, event.threadID);
    }
  }

  async handleVoiceSettings(api, threadID, messageID, senderID, input, voiceSetting) {
    const cmd = input.split(" ")[1]?.toLowerCase();

    if (!cmd || (!["on", "off"].includes(cmd) && isNaN(cmd))) {
      return api.sendMessage(
        "⚙️ | استخدام:\n" +
        "`.بي ضبط_الصوت on` - تفعيل الصوت\n" +
        "`.بي ضبط_الصوت off` - إيقاف الصوت\n" +
        "`.بي ضبط_الصوت 1-8` - اختر نموذج",
        threadID,
        messageID
      );
    }

    if (cmd === "on") {
      voiceSetting.voice = true;
    } else if (cmd === "off") {
      voiceSetting.voice = false;
    } else {
      const modelNum = parseInt(cmd);
      if (!piVoiceModels[modelNum]) {
        return api.sendMessage("⚠️ | النماذج المدعومة: 1 إلى 8", threadID, messageID);
      }
      voiceSetting.voice = true;
      voiceSetting.model = modelNum;
    }

    return api.sendMessage(
      `✅ | الصوت: ${voiceSetting.voice ? "🔊 مُفعّل" : "🔇 مُيقّف"}\n` +
      `🎙️ | النموذج: ${piVoiceModels[voiceSetting.model]}`,
      threadID,
      messageID
    );
  }

  async handleListCommand(api, threadID, messageID, senderID, voiceSetting) {
    const currentModel = piVoiceModels[voiceSetting.model] || `نموذج ${voiceSetting.model}`;
    const modelList = Object.entries(piVoiceModels)
      .map(([id, name]) => `🔢 ${id} → ${name}`).join("\n");

    return api.sendMessage(
      `📊 | معلومات صوت بي:\n` +
      `🔊 | الصوت: ${voiceSetting.voice ? "✅ مُفعّل" : "❌ مُيقّف"}\n` +
      `🎙️ | النموذج: ${currentModel}\n\n` +
      `🎭 | نماذج الصوت:\n${modelList}`,
      threadID,
      messageID
    );
  }

  async getUserVoiceSetting(userId) {
    // استخدام Global storage (يمكن تحسينه لاحقاً بـ database)
    if (!global.piVoiceSettings) global.piVoiceSettings = new Map();
    
    if (!global.piVoiceSettings.has(userId)) {
      global.piVoiceSettings.set(userId, { voice: false, model: 1 });
    }
    return global.piVoiceSettings.get(userId);
  }

  saveReplyHandler(messageID, senderID, session, voiceSetting) {
    if (!global.client) return;
    if (!global.client.handler) global.client.handler = { reply: new Map() };
    
    global.client.handler.reply.set(messageID, {
      name: this.name,
      author: senderID,
      messageID,
      session,
      voiceSetting
    });
  }

  async callPi(query, session, voice = false, model = 1) {
    try {
      const { data: { public: baseUrl } } = await axios.get(
        "https://raw.githubusercontent.com/Tanvir0999/stuffs/refs/heads/main/raw/addresses.json"
      );
      
      const { data } = await axios.get(
        `${baseUrl}/pi?query=${encodeURIComponent(query)}&session=${encodeURIComponent(session)}&voice=${voice}&model=${model}`
      );
      
      return data.data;
    } catch (error) {
      console.error("[Pi API Error]", error.message);
      throw new Error("فشل الاتصال بخادم بي");
    }
  }
}

export default new PiCommand();
