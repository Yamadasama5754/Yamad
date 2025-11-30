import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const videoLinks = {
    1: { name: "لوفي", links: ["https://i.imgur.com/RBuA0TC.mp4", "https://i.imgur.com/xxhG9xs.mp4", "https://i.imgur.com/HEpZ7PF.mp4", "https://i.imgur.com/1a7aIpe.mp4", "https://i.imgur.com/0uI73Dh.mp4", "https://i.imgur.com/omH37v7.mp4", "https://i.imgur.com/MwXNhQX.mp4", "https://i.imgur.com/MOGOtB4.mp4", "https://i.imgur.com/fw9YIaM.mp4", "https://i.imgur.com/LJ7w3Nc.mp4"] },
    2: { name: "زورو", links: ["https://i.imgur.com/XfJsZVX.mp4", "https://i.imgur.com/ZSseQ6d.mp4", "https://i.imgur.com/dbDRoNe.mp4", "https://i.imgur.com/ftYYxed.mp4", "https://i.imgur.com/nh8MhRy.mp4", "https://i.imgur.com/brzpnbE.mp4"] },
    3: { name: "نامي", links: ["https://i.imgur.com/vbQR4gu.mp4", "https://i.imgur.com/Na93qR2.mp4", "https://i.imgur.com/WNYM8GZ.mp4", "https://i.imgur.com/0DQ5QRn.mp4"] },
    4: { name: "اوسوب", links: ["https://i.imgur.com/JXDlujA.mp4", "https://i.imgur.com/sjgd5vn.mp4", "https://i.imgur.com/BAdiIch.mp4", "https://i.imgur.com/z22hodS.mp4", "https://i.imgur.com/wc9TfG8.mp4"] },
    5: { name: "سانجي", links: ["https://i.imgur.com/bSYgTE0.mp4", "https://i.imgur.com/XjYvI0C.mp4", "https://i.imgur.com/EhO0Vsk.mp4", "https://i.imgur.com/wG6DLCR.mp4", "https://i.imgur.com/WicGB6C.mp4", "https://i.imgur.com/6GUyW37.mp4"] },
    6: { name: "شوبر", links: ["https://i.imgur.com/pj7eV31.mp4", "https://i.imgur.com/J3DOinw.mp4", "https://i.imgur.com/wJz7oDl.mp4", "https://i.imgur.com/XIytSrU.mp4", "https://i.imgur.com/NV7a3O4.mp4"] },
    7: { name: "نيكو_روبين", links: ["https://i.imgur.com/HemRKi3.mp4", "https://i.imgur.com/QANW0BX.mp4", "https://i.imgur.com/e9zAQ1r.mp4", "https://i.imgur.com/WCiqGdy.mp4", "https://i.imgur.com/GGZalUl.mp4"] },
    8: { name: "فرانكي", links: ["https://i.imgur.com/KEvlnra.mp4", "https://i.imgur.com/piYCToA.mp4", "https://i.imgur.com/Im1sB3P.mp4", "https://i.imgur.com/HLIEqos.mp4"] },
    9: { name: "سولكينغ_بروك", links: ["https://i.imgur.com/4dzxExX.mp4", "https://i.imgur.com/2JJLvgA.mp4", "https://i.imgur.com/7FSNprk.mp4", "https://i.imgur.com/wC8qeLt.mp4"] },
    10: { name: "جينبي", links: ["https://i.imgur.com/kHaTYx8.mp4", "https://i.imgur.com/xZKnLW3.mp4"] },
    11: { name: "ڤيڤي", links: ["https://i.imgur.com/XIUeR0A.mp4", "https://i.imgur.com/kB4MXSj.mp4"] },
    12: { name: "لاو", links: ["https://i.imgur.com/VYkefpc.mp4", "https://i.imgur.com/wT1PcHV.mp4"] },
    13: { name: "أخرى", links: ["https://i.imgur.com/lzEP3YN.mp4", "https://i.imgur.com/gAoafdy.mp4", "https://i.imgur.com/IllBG03.mp4", "https://i.imgur.com/3BsPYWl.mp4", "https://i.imgur.com/35LMUHJ.mp4", "https://i.imgur.com/FGN6wF2.mp4", "https://i.imgur.com/8ILVqDz.mp4"] }
};

class OnePieceCommand {
    constructor() {
        this.name = "ونبيس";
        this.author = "Kaguya Project";
        this.role = 0;
        this.description = "مقطع فيديو eyecatcher لشخصيات ون بيس";
        this.aliases = ["ونبيس", "onepiece"];
        this.cooldowns = 5;
    }

    async execute({ api, event }) {
        try {
            api.setMessageReaction("🎬", event.messageID, (err) => {}, true);

            let message = "✿━━━━━━━━━━━━━━━━✿\n🎞️ | اختر شخصية من قائمة ون بيس:\n✿━━━━━━━━━━━━━━━━✿\n";
            for (const [key, value] of Object.entries(videoLinks)) {
                message += `┣ ${key} ☛ ${value.name}\n`;
            }
            message += "✿━━━━━━━━━━━━━━━━✿\n💡 رد برقم الشخصية";

            api.sendMessage(message, event.threadID, (err, info) => {
                if (!err) {
                    if (!global.client?.handler?.reply) {
                        if (!global.client) global.client = {};
                        if (!global.client.handler) global.client.handler = {};
                        global.client.handler.reply = new Map();
                    }
                    global.client.handler.reply.set(info.messageID, {
                        name: this.name,
                        type: "pick",
                        author: event.senderID
                    });

                    setTimeout(() => {
                        try {
                            global.client.handler.reply.delete(info.messageID);
                        } catch (e) {}
                    }, 60000);
                }
            }, event.messageID);

        } catch (error) {
            console.error("[ONEPIECE] خطأ:", error);
            api.sendMessage("❌ حدث خطأ في الأمر", event.threadID, event.messageID);
        }
    }

    async onReply({ api, event, reply }) {
        try {
            if (reply.type === "pick" && reply.name === "ونبيس" && reply.author === event.senderID) {
                const characterIndex = parseInt(event.body);

                if (!videoLinks[characterIndex]) {
                    api.setMessageReaction("❌", event.messageID, (err) => {}, true);
                    return api.sendMessage("❌ رقم غير صالح. يرجى المحاولة مرة أخرى", event.threadID, event.messageID);
                }

                const { name, links } = videoLinks[characterIndex];
                const validLinks = links.filter(link => link.trim() !== "");
                
                if (validLinks.length === 0) {
                    return api.sendMessage("❌ لا توجد مقاطع لهذه الشخصية الآن", event.threadID, event.messageID);
                }

                const randomIndex = Math.floor(Math.random() * validLinks.length);
                const randomVideo = validLinks[randomIndex];
                const tempDir = path.join(__dirname, "cache");
                
                if (!fs.existsSync(tempDir)) {
                    fs.mkdirSync(tempDir, { recursive: true });
                }

                const tempVideoPath = path.join(tempDir, `${name}_${Date.now()}.mp4`);

                api.setMessageReaction("⬇️", event.messageID, (err) => {}, true);

                try {
                    const response = await axios.get(randomVideo, { responseType: "stream", timeout: 60000 });
                    const writeStream = fs.createWriteStream(tempVideoPath);
                    response.data.pipe(writeStream);

                    writeStream.on("finish", async () => {
                        api.setMessageReaction("📤", event.messageID, (err) => {}, true);

                        await api.sendMessage({
                            body: `✨ eyecatcher شخصية ${name} ✨`,
                            attachment: fs.createReadStream(tempVideoPath)
                        }, event.threadID);

                        setTimeout(() => {
                            try {
                                if (fs.existsSync(tempVideoPath)) fs.unlinkSync(tempVideoPath);
                            } catch (e) {}
                        }, 3000);

                        api.setMessageReaction("✅", event.messageID, (err) => {}, true);
                    });

                    writeStream.on("error", (error) => {
                        console.error("[ONEPIECE] خطأ في الكتابة:", error);
                        api.setMessageReaction("❌", event.messageID, (err) => {}, true);
                        api.sendMessage("❌ خطأ في تحميل المقطع", event.threadID, event.messageID);
                    });
                } catch (downloadError) {
                    console.error("[ONEPIECE] خطأ في التنزيل:", downloadError);
                    api.setMessageReaction("❌", event.messageID, (err) => {}, true);
                    api.sendMessage("❌ فشل تحميل المقطع. حاول مرة أخرى", event.threadID, event.messageID);
                }
            }
        } catch (error) {
            console.error("[ONEPIECE] خطأ في onReply:", error);
        }
    }
}

export default new OnePieceCommand();
