import axios from 'axios';
import fs from 'fs';
import path from 'path';

export default {
    name: "صور",
    author: "HUSSEIN YACOUBI",
    role: "member",
    aliases: ["بنتريست"],
    description: "البحث عن الصور من بنترست",
    execute: async function({ api, event, args }) {

        if (args.length === 0) {
            return api.sendMessage("⚠️ | من فضلك أدخل كلمة بحث للبحث عن الصور.", event.threadID, event.messageID);
        }

        const keySearch = args.join(" ");
        api.setMessageReaction("⏱️", event.messageID, (err) => {}, true);

        try {
            console.log(`🔍 البحث عن الصور: ${keySearch}`);
            
            // استدعاء API بخيارات أفضل
            const pinterestResponse = await axios.get(
                `https://smfahim.xyz/pin?title=${encodeURIComponent(keySearch)}&search=9`,
                { timeout: 15000 }
            );

            console.log("📊 رد API:", JSON.stringify(pinterestResponse.data).substring(0, 200));

            // التحقق من وجود البيانات
            if (!pinterestResponse.data || !pinterestResponse.data.data || !Array.isArray(pinterestResponse.data.data)) {
                api.setMessageReaction("❌", event.messageID, (err) => {}, true);
                return api.sendMessage("❌ | لم يتم العثور على صور متعلقة بكلمة البحث.", event.threadID, event.messageID);
            }

            const imageUrls = pinterestResponse.data.data.slice(0, 9);

            if (imageUrls.length === 0) {
                api.setMessageReaction("❌", event.messageID, (err) => {}, true);
                return api.sendMessage("❌ | لم يتم العثور على صور.", event.threadID, event.messageID);
            }

            const cacheDir = path.join(process.cwd(), 'cache');
            if (!fs.existsSync(cacheDir)) {
                fs.mkdirSync(cacheDir, { recursive: true });
            }

            const imgData = [];
            
            for (let i = 0; i < imageUrls.length; i++) {
                try {
                    const imgPath = path.join(cacheDir, `image_${Date.now()}_${i}.jpg`);
                    const imageResponse = await axios.get(imageUrls[i], { 
                        responseType: 'arraybuffer',
                        timeout: 10000,
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                        }
                    });
                    fs.writeFileSync(imgPath, Buffer.from(imageResponse.data, 'binary'));
                    imgData.push(fs.createReadStream(imgPath));
                } catch (imgErr) {
                    console.error(`❌ خطأ في تحميل الصورة ${i}:`, imgErr.message);
                }
            }

            if (imgData.length === 0) {
                api.setMessageReaction("❌", event.messageID, (err) => {}, true);
                return api.sendMessage("❌ | فشل تحميل الصور. حاول لاحقاً.", event.threadID, event.messageID);
            }

            api.sendMessage({
                attachment: imgData,
                body: `[⚜️] تم العثور على ${imgData.length} صور`
            }, event.threadID, (err, info) => {
                if (err) console.error("❌ خطأ في الإرسال:", err);

                // تنظيف الملفات
                setTimeout(() => {
                    for (let i = 0; i < imageUrls.length; i++) {
                        try {
                            const imgPath = path.join(cacheDir, `image_${Date.now()}_${i}.jpg`);
                            if (fs.existsSync(imgPath)) {
                                fs.unlinkSync(imgPath);
                            }
                        } catch (e) {}
                    }
                }, 2000);

                api.setMessageReaction("✅", event.messageID, (err) => {}, true);
            });

        } catch (error) {
            console.error("❌ خطأ في أمر صور:", error.message);
            api.setMessageReaction("❌", event.messageID, (err) => {}, true);
            api.sendMessage(`❌ | حدث خطأ: ${error.message}`, event.threadID, event.messageID);
        }
    }
};
