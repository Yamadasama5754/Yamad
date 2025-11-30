class RamadanCommand {
  constructor() {
    this.name = "رمضان";
    this.author = "عمر & محسّن";
    this.cooldowns = 5;
    this.description = "الوقت المتبقي لشهر رمضان المبارك ⏳";
    this.role = 0;
    this.aliases = ["ramadan", "رمضان_كريم"];
  }

  getNextRamadan() {
    // رمضان 1447 هـ = 19 فبراير 2026 - 20 مارس 2026
    // رمضان 1448 هـ = 8 فبراير 2027 - 9 مارس 2027
    const now = new Date();
    
    // تاريخ رمضان 1447 هـ (2026)
    let ramadanDate = new Date("February 19, 2026 00:00:00");
    
    // إذا مضى رمضان 2026، استخدم رمضان 2027
    if (now > ramadanDate) {
      ramadanDate = new Date("February 8, 2027 00:00:00");
    }
    
    return ramadanDate;
  }

  calculateTimeRemaining(targetDate) {
    const now = new Date();
    const timeDifference = targetDate - now;

    if (timeDifference < 0) {
      return null; // التاريخ قد مضى
    }

    const seconds = Math.floor((timeDifference / 1000) % 60);
    const minutes = Math.floor((timeDifference / 1000 / 60) % 60);
    const hours = Math.floor((timeDifference / (1000 * 60 * 60)) % 24);
    const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24));

    return { days, hours, minutes, seconds };
  }

  async execute({ api, event }) {
    try {
      api.setMessageReaction("⏳", event.messageID, (err) => {}, true);

      const ramadanDate = this.getNextRamadan();
      const timeRemaining = this.calculateTimeRemaining(ramadanDate);

      if (!timeRemaining) {
        const now = new Date();
        const formattedDate = ramadanDate.toLocaleDateString("ar-EG", {
          year: "numeric",
          month: "long",
          day: "numeric",
          timeZone: "Africa/Cairo"
        });
        
        api.setMessageReaction("❌", event.messageID, (err) => {}, true);
        return api.sendMessage(
          `❌ شهر رمضان قد مضى! 😢\nالموعد القادم: ${formattedDate}`,
          event.threadID,
          event.messageID
        );
      }

      const formattedDate = ramadanDate.toLocaleDateString("ar-EG", {
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "Africa/Cairo"
      });

      let message = `🌙 الوقت المتبقي لشهر رمضان المبارك 🌙\n`;
      message += `═══════════════════════════\n`;
      message += `📅 التاريخ: ${formattedDate}\n\n`;
      message += `⏱️ الوقت المتبقي:\n`;
      message += `\n  📆 ${timeRemaining.days} يوم\n`;
      message += `  🕐 ${timeRemaining.hours} ساعة\n`;
      message += `  ⏲️ ${timeRemaining.minutes} دقيقة\n`;
      message += `  ⏱️ ${timeRemaining.seconds} ثانية\n`;
      message += `\n═══════════════════════════\n`;
      message += `🤲 اللهم بلّغنا رمضان\n`;
      message += `💚 وصيامنا فيه مقبول`;

      api.setMessageReaction("✅", event.messageID, (err) => {}, true);
      return api.sendMessage(message, event.threadID, event.messageID);

    } catch (error) {
      console.error("[RAMADAN] خطأ:", error);
      api.setMessageReaction("❌", event.messageID, (err) => {}, true);
      return api.sendMessage(
        "❌ حدث خطأ: " + error.message,
        event.threadID,
        event.messageID
      );
    }
  }
}

export default new RamadanCommand();
