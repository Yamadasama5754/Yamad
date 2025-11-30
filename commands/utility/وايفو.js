class WaifuCommand {
  constructor() {
    this.name = "وايفو";
    this.author = "Kaguya Project";
    this.cooldowns = 5;
    this.description = "احصل على شخصية أنمي عشوائية 🌸";
    this.role = 0;
    this.aliases = ["وايفو", "waifu"];
  }

  async onLoad() {
    console.log("[WAIFU] تم تحضير أمر الوايفو بنجاح");
  }

  async execute({ api, event }) {
    try {
      api.setMessageReaction("🌸", event.messageID, (err) => {}, true);

      // قائمة شخصيات الأنمي المشهورة
      const waifuList = [
        { name: "Sakura Haruno", anime: "Naruto", description: "شعرها وردي، طبيبة ماهرة ومقاتلة قوية" },
        { name: "Rem", anime: "Re:Zero", description: "شعرها أزرق، عينان مختلفتان، تحب إيميليا" },
        { name: "Miku Nakano", anime: "The Quintessential Quintuplets", description: "شعرها أسود، شخصية طيبة القلب" },
        { name: "Asuna Yuuki", anime: "Sword Art Online", description: "شعرها أحمر، سيفها لامع وحادة جداً" },
        { name: "Rin Tohsaka", anime: "Fate", description: "شعرها أسود طويل، سحر قوي جداً" },
        { name: "Emilia", anime: "Re:Zero", description: "ساحرة بنات الشياطين، قلب طيب جداً" },
        { name: "Saber", anime: "Fate Stay Night", description: "فارسة ذهبية، سيف الملوك المشهور" },
        { name: "Tohka Yatogami", anime: "Date A Live", description: "روح جميلة جداً، تحب الطعام والألعاب" },
        { name: "Mikoto Misaka", anime: "A Certain Scientific Railgun", description: "تستخدم الكهرباء، قوية جداً وذكية" },
        { name: "Haruhi Suzumiya", anime: "The Melancholy of Haruhi", description: "تتحكم بالعالم بدون أن تعرف، شخصية غريبة وممتعة" },
        { name: "Yuki Nagato", anime: "The Melancholy of Haruhi", description: "روبوت جميل، هادئة جداً وغامضة" },
        { name: "Hatsune Miku", anime: "Vocaloid", description: "شعرها أزرق فيروز، تغني أغاني رائعة" },
        { name: "Kaguya Shinomiya", anime: "Kaguya-sama Love is War", description: "أميرة غنية جداً، ذكية وجميلة" },
        { name: "Zero Two", anime: "Darling in the Franxx", description: "قرون حمراء، شعرها طويل وأبيض، جميلة غريبة" },
        { name: "Chikane Himemiya", anime: "Kannazuki no Miko", description: "شعرها طويل وأسود، قوية جداً" }
      ];

      const randomWaifu = waifuList[Math.floor(Math.random() * waifuList.length)];

      const message = `✨ **${randomWaifu.name}** من أنمي ${randomWaifu.anime}\n\n${randomWaifu.description}\n\n🌸 جميلة جداً أليس كذلك؟`;

      api.sendMessage(message, event.threadID, (err) => {
        api.setMessageReaction("✅", event.messageID, (err) => {}, true);
      }, event.messageID);

    } catch (error) {
      console.error("[WAIFU] خطأ:", error.message);
      api.setMessageReaction("❌", event.messageID, (err) => {}, true);
      api.sendMessage(`❌ حدث خطأ: ${error.message}`, event.threadID, event.messageID);
    }
  }
}

export default new WaifuCommand();
