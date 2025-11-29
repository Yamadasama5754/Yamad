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
    description: "يقوم بإنشاء صورة معالجة معينة أو رسالة مرحاض",
    role: "member",
    cooldowns: 60,
    execute: async ({ api, event, args, Economy }) => {
        try {
            const mention = Object.keys(event.mentions);
            
            // إذا لم يكن هناك منشن - رسالة طريفة فقط
            if (mention.length == 0) {
                api.setMessageReaction("💦", event.messageID, (err) => {}, true);
                
                const jokes = [
                    "🚽 أنت الآن في مجلس الوزراء... مجلس وزرا الحمام! 😂",
                    "🚽 مرحباً في أفخم الأماكن في البيت... المرحاض! 🤣",
                    "🚽 أنت تجلس على كرسي العرش... عرش المرحاض! 😆",
                    "🚽 هنا الجميع متساوون... فوق أو تحت! 🤪",
                    "🚽 المرحاض: المكان الوحيد الذي تشعر فيه بأنك ملك! 👑",
                    "🚽 أقلس في هنا أنت الزعيم! 🎖️",
                    "🚽 مرحاض اليوم = راحة البال! 😌"
                ];
                
                const randomJoke = jokes[Math.floor(Math.random() * jokes.length)];
                return api.sendMessage(randomJoke, event.threadID);
            }
            
            // إذا كان هناك منشن - صورة مع الرسالة
            api.setMessageReaction("⏳", event.messageID, (err) => {}, true);
            
            const cost = 250;
            const userBalance = (await Economy.getBalance(event.senderID)).data;
            
            if (userBalance < cost) {
                api.setMessageReaction("❌", event.messageID, (err) => {}, true);
                return api.sendMessage(`⚠️ | تحتاج إلى ${cost} دولار في محفظتك. رصيدك الحالي: ${userBalance}`, event.threadID, event.messageID);
            }
            
            await Economy.decrease(cost, event.senderID);
            
            // وضع صورة المتحدث مع صورة المنشن
            const one = event.senderID;
            const two = mention[0];
            const ptth = await bal(one, two);
            api.setMessageReaction("✅", event.messageID, (err) => {}, true);
            api.sendMessage({ 
                body: `أنت وهذا الشخص تستحقان هذا المكان يا وجوه المرحاض 🤣\n💸 تم خصم 250 دولار`, 
                attachment: fs.createReadStream(ptth) 
            }, event.threadID, () => {
                if (fs.existsSync(ptth)) fs.unlinkSync(ptth);
            });
        } catch (error) {
            console.error("Toilet command error:", error);
            api.setMessageReaction("❌", event.messageID, (err) => {}, true);
            api.sendMessage("❌ | حدث خطأ: " + error.message, event.threadID, event.messageID);
        }
    }
};
