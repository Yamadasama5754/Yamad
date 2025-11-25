import moment from "moment-timezone";
import config from "../../KaguyaSetUp/config.js";

class FriendRequests {
  constructor() {
    this.name = "طلبات";
    this.author = config.BOT_NAME || "Kaguya Project";
    this.cooldowns = 5;
    this.description = "عرض طلبات الصداقة وقبولها أو رفضها";
    this.role = 2;
    this.aliases = ["accept", "acp"];
  }

  async execute({ api, event }) {
    try {
      const form = {
        av: api.getCurrentUserID(),
        fb_api_req_friendly_name: "FriendingCometFriendRequestsRootQueryRelayPreloader",
        fb_api_caller_class: "RelayModern",
        doc_id: "4499164963466303",
        variables: JSON.stringify({ input: { scale: 3 } })
      };

      const res = await api.httpPost("https://www.facebook.com/api/graphql/", form);
      const parsed = JSON.parse(res);
      const listRequest = parsed?.data?.viewer?.friending_possibilities?.edges || [];

      if (!listRequest || listRequest.length === 0)
        return api.sendMessage("📭 لا توجد طلبات صداقة معلقة.", event.threadID);

      const limitedRequests = listRequest.slice(0, 20);

      let msg = "📩 طلبات الصداقة (أول 20 فقط):\n\n";
      limitedRequests.forEach((user, i) => {
        msg += `🔹 ${i + 1}. ${user.node.name}\n`;
        msg += `   🆔: ${user.node.id}\n`;
        msg += `   🔗: ${user.node.url.replace("www.facebook", "fb")}\n`;
        msg += `   ⏰: ${moment(user.time * 1000).tz("Africa/Casablanca").format("DD/MM/YYYY HH:mm:ss")}\n\n`;
      });

      msg += "💡 رد بـ:\n"
           + "• قبول <رقم> لقبول طلب\n"
           + "• رفض <رقم> لرفض طلب\n"
           + "• قبول الكل لقبول الكل\n"
           + "• رفض الكل لرفض الكل\n\n"
           + "⏳ سيتم حذف الرسالة تلقائيًا بعد دقيقتين.";

      api.sendMessage(msg, event.threadID, (err, info) => {
        if (err) return;
        global.client.handler.reply.set(info.messageID, {
          name: this.name,
          messageID: info.messageID,
          listRequest: limitedRequests,
          author: event.senderID,
          unsendTimeout: setTimeout(() => {
            api.unsendMessage(info.messageID);
          }, 2 * 60 * 1000)
        });
      }, event.messageID);

    } catch (err) {
      api.sendMessage("❌ حدث خطأ أثناء جلب الطلبات:\n" + err.message, event.threadID);
    }
  }

  async onReply({ api, event, reply }) { // ✅ استقبل reply بحرف صغير
    if (!reply) {
      return api.sendMessage("⚠️ لم يتم العثور على بيانات الرد.", event.threadID);
    }

    const { author, listRequest, messageID } = reply;
    if (author !== event.senderID) return;

    clearTimeout(reply.unsendTimeout);
    const args = event.body.trim().toLowerCase().split(/\s+/);

    const form = {
      av: api.getCurrentUserID(),
      fb_api_caller_class: "RelayModern",
      variables: {
        input: {
          source: "friends_tab",
          actor_id: api.getCurrentUserID(),
          client_mutation_id: Math.round(Math.random() * 19).toString()
        },
        scale: 3,
        refresh_num: 0
      }
    };

    const success = [];
    const failed = [];

    if (args[0] === "قبول") {
      form.fb_api_req_friendly_name = "FriendingCometFriendRequestConfirmMutation";
      form.doc_id = "3147613905362928";
    } else if (args[0] === "رفض") {
      form.fb_api_req_friendly_name = "FriendingCometFriendRequestDeleteMutation";
      form.doc_id = "4108254489275063";
    } else {
      return api.sendMessage("❌ الأمر غير صحيح. استخدم: قبول أو رفض متبوعًا برقم أو الكل", event.threadID, event.messageID);
    }

    let targetIDs = args.slice(1);
    if (args[1] === "الكل") {
      targetIDs = Array.from({ length: listRequest.length }, (_, i) => i + 1);
    }

    const newTargetIDs = [];
    const promiseFriends = [];

    for (const stt of targetIDs) {
      const user = listRequest[parseInt(stt) - 1];
      if (!user) {
        failed.push(`🚫 لم يتم العثور على الطلب رقم ${stt}`);
        continue;
      }
      form.variables.input.friend_requester_id = user.node.id;
      form.variables = JSON.stringify(form.variables);
      newTargetIDs.push(user);
      promiseFriends.push(api.httpPost("https://www.facebook.com/api/graphql/", form));
      form.variables = JSON.parse(form.variables);
    }

    const results = await Promise.allSettled(promiseFriends);
    results.forEach((result, i) => {
      const user = newTargetIDs[i];
      try {
        if (result.status === "fulfilled") {
          const data = typeof result.value === "string" ? JSON.parse(result.value) : result.value;
          if (!data.errors) {
            success.push(`✅ ${user.node.name} (${user.node.id})`);
          } else {
            failed.push(`❌ ${user.node.name} (${user.node.id})`);
          }
        } else {
          failed.push(`❌ ${user.node.name} (${user.node.id}) - خطأ في التنفيذ`);
        }
      } catch (err) {
        failed.push(`⚠️ ${user.node.name} (${user.node.id}) - خطأ في التحليل: ${err.message}`);
      }
    });

    let replyMsg = "";
    if (success.length > 0) {
      replyMsg += `✨ تم ${args[0] === "قبول" ? "قبول" : "رفض"} ${success.length} طلب:\n${success.join("\n")}\n\n`;
    }
    if (failed.length > 0) {
      replyMsg += `⚠️ فشل في معالجة ${failed.length} طلب:\n${failed.join("\n")}`;
    }

    if (replyMsg) {
      api.sendMessage(replyMsg, event.threadID, event.messageID);
    } else {
      api.sendMessage("❌ لم يتم معالجة أي طلب.", event.threadID);
    }

    try {
      api.unsendMessage(messageID);
    } catch (err) {
      console.error("⚠️ خطأ أثناء إلغاء الرسالة:", err);
    }
  }
}

export default new FriendRequests();