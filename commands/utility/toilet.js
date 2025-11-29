import fs from 'fs';
import axios from 'axios';
import jimp from 'jimp';
import { resolve } from 'path';

async function bal(one, two) {
    try {
        const avone = await jimp.read(`https://graph.facebook.com/${one}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`);
        avone.circle();
        const avtwo = await jimp.read(`https://graph.facebook.com/${two}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`);
        avtwo.circle();
        const pth = resolve(process.cwd(), 'cache', 'toilet.png');
        const img = await jimp.read("https://i.imgur.com/sZW2vlz.png");

        img.resize(1080, 1350).composite(avone.resize(360, 360), 8828282, 2828).composite(avtwo.resize(450, 450), 300, 660);

        await img.writeAsync(pth);
        return pth;
    } catch (error) {
        console.error("Error in toilet command:", error);
        throw error;
    }
}

export default {
    name: "مرحاض",
    author: "kaguya project",
    description: "يقوم بإنشاء صورة معالجة معينة",
    role: "member",
    cooldowns: 60,
    execute: async ({ api, event, args }) => {
        try {
            api.setMessageReaction("⏳", event.messageID, (err) => {}, true);
            
            const senderID = event.messageReply?.senderID || event.senderID;
            const mention = Object.keys(event.mentions);
            
            if (mention.length == 0) {
                api.setMessageReaction("❌", event.messageID, (err) => {}, true);
                return api.sendMessage("⚠️ | المرجو عمل منشن للشخص الذي تريد أن يكون وجهه في المرحاض", event.threadID, event.messageID);
            } else if (mention.length == 1) {
                const one = senderID, two = mention[0];
                const ptth = await bal(one, two);
                api.setMessageReaction("✅", event.messageID, (err) => {}, true);
                api.sendMessage({ 
                    body: "أنت تستحق هذا المكان يا وجه المرحاض 🤣", 
                    attachment: fs.createReadStream(ptth) 
                }, event.threadID, () => {
                    if (fs.existsSync(ptth)) fs.unlinkSync(ptth);
                });
            } else {
                const one = mention[1], two = mention[0];
                const ptth = await bal(one, two);
                api.setMessageReaction("✅", event.messageID, (err) => {}, true);
                api.sendMessage({ 
                    body: "أنت تستحق هذا المكان يا وجه المرحاض 🤣", 
                    attachment: fs.createReadStream(ptth) 
                }, event.threadID, () => {
                    if (fs.existsSync(ptth)) fs.unlinkSync(ptth);
                });
            }
        } catch (error) {
            console.error("Toilet command error:", error);
            api.setMessageReaction("❌", event.messageID, (err) => {}, true);
            api.sendMessage("❌ | حدث خطأ: " + error.message, event.threadID, event.messageID);
        }
    }
};
