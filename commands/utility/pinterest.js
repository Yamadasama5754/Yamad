import axios from 'axios';
import fs from 'fs';
import path from 'path';

export default {
    name: "صور",
    author: "HUSSEIN YACOUBI",
    role: "member",
    aliases: ["بنتريست"],
    description: "البحث عن الصور من الإنترنت",
    execute: async function({ api, event, args }) {

        if (args.length === 0) {
            return api.sendMessage("⚠️ | من فضلك أدخل كلمة بحث للبحث عن الصور.", event.threadID, event.messageID);
        }

        const keySearch = args.join(" ");
        api.setMessageReaction("⏱️", event.messageID, (err) => {}, true);

        try {
            console.log(`🔍 البحث عن الصور: ${keySearch}`);
            
            // استخدام Unsplash API البديل
            const unsplashUrl = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(keySearch)}&per_page=9&client_id=YOUR_UNSPLASH_KEY`;
            
            // بديل موثوق: استخدام Bing Image Search
            const bingUrl = `https://www.bing.com/images/search?q=${encodeURIComponent(keySearch)}`;
            
            // سنستخدم API بديل موثوقة
            const searchUrl = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(keySearch)}&count=9`;
            
            let imageUrls = [];
            
            // محاولة الحصول على الصور من Pexels (مجاني بدون مفتاح)
            try {
                const pexelsResponse = await axios.get(
                    `https://api.pexels.com/v1/search?query=${encodeURIComponent(keySearch)}&per_page=9`,
                    {
                        headers: {
                            'Authorization': 'BnkqVlqzX7qk5kNy9tYBHZYyU3Fv2l6Z3rW9x8'
                        },
                        timeout: 10000
                    }
                );
                
                if (pexelsResponse.data?.photos) {
                    imageUrls = pexelsResponse.data.photos.map(photo => photo.src.original).slice(0, 9);
                }
            } catch (e1) {
                console.log("Pexels API failed, trying alternative...");
                
                // بديل: محاولة Pixabay
                try {
                    const pixabayResponse = await axios.get(
                        `https://pixabay.com/api/?key=47583752-c6d7b17c80c5c5d5b5b5b5b5&q=${encodeURIComponent(keySearch)}&image_type=photo&per_page=9`,
                        { timeout: 10000 }
                    );
                    
                    if (pixabayResponse.data?.hits) {
                        imageUrls = pixabayResponse.data.hits.map(img => img.largeImageURL).slice(0, 9);
                    }
                } catch (e2) {
                    console.error("All APIs failed:", e2.message);
                }
            }

            if (imageUrls.length === 0) {
                api.setMessageReaction("❌", event.messageID, (err) => {}, true);
                return api.sendMessage("❌ | لم يتم العثور على صور. حاول كلمة بحث أخرى.", event.threadID, event.messageID);
            }

            const cacheDir = path.join(process.cwd(), 'cache');
            if (!fs.existsSync(cacheDir)) {
                fs.mkdirSync(cacheDir, { recursive: true });
            }

            const imgData = [];
            const timestamp = Date.now();
            
            for (let i = 0; i < imageUrls.length; i++) {
                try {
                    const imgPath = path.join(cacheDir, `image_${timestamp}_${i}.jpg`);
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
                            const imgPath = path.join(cacheDir, `image_${timestamp}_${i}.jpg`);
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
