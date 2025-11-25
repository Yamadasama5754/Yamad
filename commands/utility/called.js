import config from "../../KaguyaSetUp/config.js";
import { getStreamsFromAttachment } from "../../utils/index.js";

const mediaTypes = ["photo", "png", "animated_image", "video", "audio"];

class CallAdmin {
  constructor() {
    this.name = "تقرير";
    this.author = "Yamada KJ & Alastor";
    this.cooldowns = 5;
    this.role = 0;
    this.description = "إرسال رسالة إلى الأدمن والرد عليها";
    this.aliases = ["اتصل", "callad"];
  }

  async execute({ args, api, event, usersData, threadsData }) {
    const { senderID, threadID, isGroup } = event;

    if (!args?.length) return api.sendMessage("✉️ اكتب محتوى الرسالة التي تريد إرسالها للأدمن.", threadID);

    if (!config.ADMIN_IDS || config.ADMIN_IDS.length === 0)
      return api.sendMessage("⚠️ لا يوجد أي أدمن مسجل في البوت حالياً.", threadID);

    const senderName = (usersData?.getName && await usersData.getName(senderID)) || "مستخدم غير معروف";
    const threadName = isGroup
      ? (threadsData?.get && (await threadsData.get(threadID))?.threadName) || "مجموعة غير معروفة"
      : "محادثة خاصة";

    const msg = `📨 رسالة من المستخدم:\n👤 الاسم: ${senderName}\n🆔 ID: ${senderID}\n👥 المجموعة: ${threadName}\n\n📩 المحتوى:\n${args.join(" ")}\n\n🔁 رد على هذه الرسالة للرد على المستخدم.`;

    const attachments = await getStreamsFromAttachment([
      ...event.attachments,
      ...(event.messageReply?.attachments || [])
    ].filter(item => mediaTypes.includes(item.type)));

    const formMessage = {
      body: msg,
      mentions: [{ id: senderID, tag: senderName }],
      attachment: attachments
    };

    const success = [];
    const failed = [];

    for (const adminID of config.ADMIN_IDS) {
      try {
        const sent = await api.sendMessage(formMessage, adminID);
        success.push(adminID);
        global.client.handler.reply.set(sent.messageID, {
          name: this.name,
          messageID: sent.messageID,
          threadID,
          messageIDSender: event.messageID,
          type: "userCallAdmin"
        });
      } catch (err) {
        failed.push(adminID);
      }
    }

    let reply = "";
    if (success.length > 0) reply += `✅ تم إرسال رسالتك إلى ${success.length} أدمن.\n`;
    if (failed.length > 0) reply += `⚠️ فشل الإرسال إلى ${failed.length} أدمن.\n`;

    return api.sendMessage(reply, threadID);
  }

  async onReply({ event, api, reply, usersData, Users }) {
    const replyData = reply;
    if (!replyData) return api.sendMessage("⚠️ لم يتم العثور على بيانات الرد.", event.threadID);

    const { type, threadID, messageIDSender } = replyData;
    const userData = usersData || Users;
    const senderName = (userData?.getName && await userData.getName(event.senderID)) || "مستخدم";

    const attachments = await getStreamsFromAttachment(event.attachments?.filter(item => mediaTypes.includes(item.type)) || []);
    const replyText = event.body?.trim() || "—";

    const formMessage = {
      body: "",
      mentions: [{ id: event.senderID, tag: senderName }],
      attachment: attachments
    };

    if (type === "userCallAdmin") {
      formMessage.body = `📬 رد من الأدمن ${senderName}:\n${replyText}\n\n🔁 يمكنك الرد على هذه الرسالة للتواصل مع الأدمن.`;
      api.sendMessage(formMessage, threadID, (err, info) => {
        if (!err) {
          global.client.handler.reply.set(info.messageID, {
            name: this.name,
            messageID: info.messageID,
            threadID: event.threadID,
            messageIDSender: event.messageID,
            type: "adminReply"
          });
        }
      }, messageIDSender);
    }

    if (type === "adminReply") {
      formMessage.body = `📥 رد من المستخدم ${senderName}:\n${replyText}\n\n🔁 يمكنك الرد على هذه الرسالة للتواصل مع المستخدم.`;
      api.sendMessage(formMessage, threadID, (err, info) => {
        if (!err) {
          global.client.handler.reply.set(info.messageID, {
            name: this.name,
            messageID: info.messageID,
            threadID: event.threadID,
            messageIDSender: event.messageID,
            type: "userCallAdmin"
          });
        }
      }, messageIDSender);
    }
  }
}

export default new CallAdmin();