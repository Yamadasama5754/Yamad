import axios from 'axios';
import fs from 'fs';
import path from 'path';

export default {
    name: "صور",
    author: "HUSSEIN YACOUBI",
    role: "member",
    aliases: ["بنتريست"],
    description: "Searches Pinterest and returns related images based on the keyword.",
    execute: async function({ api, event, args }) {

        // التحقق إذا لم يتم إدخال أي كلمة بحث
        if (args.length === 0) {
            return api.sendMessage("⚠️ | من فضلك أدخل كلمة بحث للبحث عن الصور في بنتريست.", event.threadID, event.messageID);
        }

        const keySearch = args.join(" ");

        // React with ⏱️ to indicate the search has started
        api.setMessageReaction("⏱️", event.messageID, (err) => {}, true);

        try {
            // API request to fetch Pinterest images from the new API
            const pinterestResponse = await axios.get(`https://smfahim.xyz/pin?title=${encodeURIComponent(keySearch)}&search=9`);
            const data = pinterestResponse.data.data.slice(0, 9); // Limit to 9 images

            const imgData = [];
            const cacheDir = path.join(process.cwd(), 'cache');

            // Ensure the cache directory exists
            if (!fs.existsSync(cacheDir)) {
                fs.mkdirSync(cacheDir);
            }

            for (let i = 0; i < data.length; i++) {
                const imgPath = path.join(cacheDir, `image${i + 1}.jpg`);
                const imageResponse = await axios.get(data[i], { responseType: 'arraybuffer' });
                fs.writeFileSync(imgPath, Buffer.from(imageResponse.data, 'binary'));
                imgData.push(fs.createReadStream(imgPath));
            }

            // Send the images in the chat
            api.sendMessage({
                attachment: imgData,
                body: '[⚜️] هذه عمليات البحث ذات الصلة'
            }, event.threadID, (err, info) => {
                if (err) console.error(err);

                // Clean up the cache by removing the downloaded images
                for (let i = 0; i < data.length; i++) {
                    fs.unlinkSync(path.join(cacheDir, `image${i + 1}.jpg`));
                }

                // React with ✅ to indicate the operation was successful
                api.setMessageReaction("✅", event.messageID, (err) => {}, true);
            });
        } catch (error) {
            console.error(error);
            api.sendMessage('حدث خطأ أثناء جلب الصور.', event.threadID);
        }
    }
};
