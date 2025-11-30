import fs from "fs-extra";

class MiraiEvent {
  constructor() {
    this.name = "ميراي";
    this.description = "حدث ميراي - ردود تفاعلية على الرسائل";
  }

  async execute({ api, event }) {
    const { threadID, messageID, senderID } = event;
    
    // فحص إذا كانت الرسالة فارغة أو بدون نص
    if (!event.body || typeof event.body !== "string") return;
    
    const tl = [
      "عمتكم😺؟",
      "منو ينادي محبوبه الكل >_<...",
      "أحبك🤧🖤",
      "الورده الطيبه💞🙃",
      "خادمتك فاي وقت 🖤😸",
      "سمعتك تنادي علي؟👀",
      "كنت هموت ملل بدونك 🙃💞",
      "حبك الاول والاخير🐿🎧"
    ];
    const rand = tl[Math.floor(Math.random() * tl.length)];

    const bodyLower = event.body.toLowerCase().trim();

    if (bodyLower === "مفتقدك" || bodyLower === "اشتقتلك") {
      return api.sendMessage("حياتي بدونك ولا شئ 🙃💞", threadID, messageID);
    }

    if (bodyLower === "احبك" || bodyLower === "بحبك") {
      return api.sendMessage("ميراي حبيبتك الوحيدة يولد 🤧", threadID, messageID);
    }

    if (bodyLower === "ملل" || bodyLower === "ملل يجيب شلل") {
      return api.sendMessage("امشيطلعبرراااااا", threadID, messageID);
    }

    if (bodyLower === "كيوت" || bodyLower === "كيوتت") {
      return api.sendMessage("يعمريييي🤧💞", threadID, messageID);
    }

    if (bodyLower === "شسمك" || bodyLower === "ايش هو اسمك") {
      return api.sendMessage("ميراي عمتك 💞😺", threadID, messageID);
    }

    if (bodyLower === "كيفكم" || bodyLower === "كيفك") {
      return api.sendMessage("بخير وانت👀", threadID, messageID);
    }

    if (bodyLower === "السلام عليكم" || bodyLower === "سلام عليكم") {
      return api.sendMessage("وعليكم السلام ورحمه الله وبركاته", threadID, messageID);
    }

    if (bodyLower === "جيت" || bodyLower === "سلام") {
      return api.sendMessage("منور", threadID, messageID);
    }

    if (bodyLower === "منوره ايلي" || bodyLower === "منوره كيوتتي") {
      return api.sendMessage("نورك الأصل الأصيل بلا منازع او مثيل 👀💞", threadID, messageID);
    }

    if (bodyLower === "كيفها حياتك" || bodyLower === "كيف حياتك") {
      return api.sendMessage("ماشيا الحمد لله وانت ❤️", threadID, messageID);
    }

    if (bodyLower === "ماشيا" || bodyLower === "بخير الحمد لله") {
      return api.sendMessage("دومك بخير وصحه وسعاده", threadID, messageID);
    }

    if (bodyLower === "بوت" || bodyLower === "يا بوت") {
      return api.sendMessage("يا روحها اسمي ميراي عمتك 💖", threadID, messageID);
    }

    if (bodyLower === "جييتت" || bodyLower === "باااكك") {
      return api.sendMessage("نورت البيت🫣❤", threadID, messageID);
    }

    if (bodyLower === "المطور" || bodyLower === "من المطور") {
      return api.sendMessage("يامادا حبيبي وروحي وتاج راسكم 💞🙃", threadID);
    }

    if (event.body.indexOf("كيوتتي") === 0 || event.body.indexOf("ميراي") === 0) {
      const msg = {
        body: rand
      };
      return api.sendMessage(msg, threadID, messageID);
    }
  }
}

const miraiEvent = new MiraiEvent();

export default {
  name: "ميراي",
  description: "حدث ميراي - ردود تفاعلية على الرسائل",
  execute: miraiEvent.execute.bind(miraiEvent),
};
