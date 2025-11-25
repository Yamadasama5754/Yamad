import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function checkShortCut(nickname, uid, Users) {
  try {
    // Get user data to fetch name
    const userResult = await Users.find(uid);
    const userName = userResult.data?.data?.name || userResult.data?.data?.firstName || "";
    
    if (/\{userName\}/gi.test(nickname)) {
      nickname = nickname.replace(/\{userName\}/gi, userName);
    }
    if (/\{userID\}/gi.test(nickname)) {
      nickname = nickname.replace(/\{userID\}/gi, uid);
    }
    return nickname;
  } catch (e) {
    console.error("checkShortCut error:", e);
    return nickname;
  }
}

class SetName {
  constructor() {
    this.name = "كنية";
    this.author = "Yamada KJ & Alastor";
    this.cooldowns = 5;
    this.description = "تغيير كنية الأعضاء في المجموعة";
    this.role = 0;
    this.aliases = ["name"];
  }

  async execute({ api, event, args, Users }) {
    const mentions = Object.keys(event.mentions || {});
    let uids = [];
    let nickname = args.join(" ");

    try {
      // الرد على رسالة
      if (event.messageReply && event.messageReply.senderID) {
        uids = [event.messageReply.senderID];
        nickname = args.join(" ").trim();
      }
      // تغيير جميع الأعضاء
      else if (args[0] === "الكل" || mentions.includes(event.threadID)) {
        const threadInfo = await api.getThreadInfo(event.threadID);
        uids = threadInfo.participantIDs || [];
        nickname = args[0] === "all" ? args.slice(1).join(" ") : nickname.replace(event.mentions[event.threadID], "").trim();
      }
      // تغيير أشخاص محددين
      else if (mentions.length) {
        uids = mentions;
        const allName = new RegExp(
          Object.values(event.mentions)
            .map(name => name.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&"))
            .join("|"),
          "g"
        );
        nickname = nickname.replace(allName, "").trim();
      }
      // تغيير كنيتك فقط
      else {
        uids = [event.senderID];
        nickname = nickname.trim();
      }

      if (!nickname) {
        return api.sendMessage(
          "❌ يجب تزويد كنية",
          event.threadID,
          event.messageID
        );
      }

      // Change first nickname
      if (uids.length > 0) {
        const uid = uids.shift();
        const finalNickname = await checkShortCut(nickname, uid, Users);
        await api.changeNickname(finalNickname, event.threadID, uid);
      }

      // Change remaining nicknames
      for (const uid of uids) {
        const finalNickname = await checkShortCut(nickname, uid, Users);
        await api.changeNickname(finalNickname, event.threadID, uid);
      }

      api.sendMessage(
        "✅ تم تغيير الكنية بنجاح",
        event.threadID
      );
    } catch (e) {
      console.error("SetName error:", e);
      api.sendMessage(
        "❌ حدث خطأ، جرّب تعطيل رابط الدعوة في المجموعة وحاول مرة أخرى",
        event.threadID,
        event.messageID
      );
    }
  }
}

export default new SetName();
