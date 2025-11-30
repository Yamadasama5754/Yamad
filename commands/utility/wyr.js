import axios from "axios";
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const statsFile = path.join(__dirname, "cache", "wyr_stats.json");

const ensureStatsFile = () => {
  const dir = path.dirname(statsFile);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(statsFile)) {
    fs.writeFileSync(statsFile, JSON.stringify({}));
  }
};

const getStats = (question) => {
  ensureStatsFile();
  const data = fs.readJsonSync(statsFile);
  return data[question] || { choice1: 0, choice2: 0 };
};

const saveStats = (question, stats) => {
  ensureStatsFile();
  const data = fs.readJsonSync(statsFile);
  data[question] = stats;
  fs.writeFileSync(statsFile, JSON.stringify(data, null, 2));
};

class WYRCommand {
  constructor() {
    this.name = "لوخيروك";
    this.author = "KAGUYA PROJECT & محسّن";
    this.cooldowns = 5;
    this.description = "لعبة لو خيروك بسؤال عشوائي 🎲 مع إحصائيات";
    this.role = 0;
    this.aliases = ["لوخيروك", "wyr", "خيار"];
  }

  async translateText(text) {
    try {
      const response = await axios.get(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ar&dt=t&q=${encodeURIComponent(text)}`,
        { timeout: 10000 }
      );
      return response?.data?.[0]?.[0]?.[0] || text;
    } catch (error) {
      console.warn("[WYR] خطأ في الترجمة:", error.message);
      return text;
    }
  }

  async execute({ api, event }) {
    try {
      api.setMessageReaction("🎲", event.messageID, () => {}, true);

      const response = await axios.get("https://api.popcat.xyz/wyr", {
        timeout: 10000
      });

      if (response.status !== 200 || !response.data || !response.data.ops1 || !response.data.ops2) {
        throw new Error("Invalid or missing response from the API");
      }

      const option1 = await this.translateText(response.data.ops1);
      const option2 = await this.translateText(response.data.ops2);

      // الحصول على الإحصائيات المحلية
      const questionKey = `${option1}|${option2}`;
      const localStats = getStats(questionKey);
      
      let statsText = "";
      const totalVotes = localStats.choice1 + localStats.choice2;
      
      if (totalVotes > 0) {
        const percentage1 = ((localStats.choice1 / totalVotes) * 100).toFixed(1);
        const percentage2 = ((localStats.choice2 / totalVotes) * 100).toFixed(1);
        statsText = `\n\n📊 نسب الاختيار:\n1️⃣ ${percentage1}% (${localStats.choice1} شخص)\n2️⃣ ${percentage2}% (${localStats.choice2} شخص)`;
      } else {
        statsText = `\n\n📊 كن أول من يختار!`;
      }

      const message = `لو خيروك بين:\n\n1️⃣ ${option1}\n\n2️⃣ ${option2}${statsText}\n\n👆 اختار 1 أو 2`;

      api.setMessageReaction("✅", event.messageID, () => {}, true);

      api.sendMessage(
        { body: message },
        event.threadID,
        (err, info) => {
          if (!global.client?.handler?.reply) {
            if (!global.client) global.client = {};
            if (!global.client.handler) global.client.handler = {};
            global.client.handler.reply = new Map();
          }

          global.client.handler.reply.set(info.messageID, {
            name: this.name,
            option1,
            option2,
            questionKey,
            localStats
          });

          setTimeout(() => {
            try {
              global.client.handler.reply.delete(info.messageID);
            } catch (e) {}
          }, 60000);
        },
        event.messageID
      );

    } catch (error) {
      console.error("[WYR] خطأ:", error.message);
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      api.sendMessage(
        "❌ حدث خطأ أثناء جلب السؤال. حاول مرة أخرى لاحقاً.",
        event.threadID,
        event.messageID
      );
    }
  }

  async onReply({ api, event, reply }) {
    try {
      const choice = event.body.trim();

      if (choice !== "1" && choice !== "2") {
        api.setMessageReaction("❌", event.messageID, () => {}, true);
        return api.sendMessage(
          "❌ يرجى اختيار 1 أو 2 فقط",
          event.threadID,
          event.messageID
        );
      }

      let replyData = reply;
      if (!replyData || !replyData.option1) {
        if (event.messageReply && global.client?.handler?.reply) {
          replyData = global.client.handler.reply.get(event.messageReply.messageID);
        }
      }

      if (!replyData) {
        api.setMessageReaction("❌", event.messageID, () => {}, true);
        return api.sendMessage(
          "❌ انتهت صلاحية هذا السؤال. استخدم الأمر مرة أخرى.",
          event.threadID,
          event.messageID
        );
      }

      // تحديث الإحصائيات
      let updatedStats = replyData.localStats;
      if (choice === "1") {
        updatedStats.choice1 += 1;
      } else {
        updatedStats.choice2 += 1;
      }
      saveStats(replyData.questionKey, updatedStats);

      let message = "";
      if (choice === "1") {
        message = `✅ اخترت: ${replyData.option1}\n\n`;
      } else {
        message = `✅ اخترت: ${replyData.option2}\n\n`;
      }

      const totalVotes = updatedStats.choice1 + updatedStats.choice2;
      const percentage1 = ((updatedStats.choice1 / totalVotes) * 100).toFixed(1);
      const percentage2 = ((updatedStats.choice2 / totalVotes) * 100).toFixed(1);
      
      message += `📊 إحصائيات عام الناس:\n`;
      message += `1️⃣ ${percentage1}% (${updatedStats.choice1} شخص) اختاروا: ${replyData.option1}\n`;
      message += `2️⃣ ${percentage2}% (${updatedStats.choice2} شخص) اختاروا: ${replyData.option2}`;

      api.setMessageReaction("✅", event.messageID, () => {}, true);
      api.sendMessage(message, event.threadID, event.messageID);

    } catch (error) {
      console.error("[WYR] خطأ في onReply:", error.message);
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      api.sendMessage(
        "❌ حدث خطأ أثناء معالجة اختيارك.",
        event.threadID,
        event.messageID
      );
    }
  }
}

export default new WYRCommand();
