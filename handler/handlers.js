import { log } from "../logger/index.js";
import fs from "fs";

export class CommandHandler {
  constructor({ api, event, Threads, Users, Economy, Exp }) {
    this.arguments = { api, event, Users, Threads, Economy, Exp };
    this.client = global.client;
    this.config = this.client?.config || {};
    this.commands = this.client?.commands || new Map();
    this.aliases = this.client?.aliases || new Map();
    this.cooldowns = this.client?.cooldowns || new Map();
    this.handler = this.client?.handler || {};
    this.events = this.client?.events || new Map();
    this.commandFunctions = this.client?.commandFunctions || new Map();
    this.eventFunctions = this.client?.eventFunctions || new Map();
  }


  async handleCommand() {
    try {
      const { Users, Threads, api, event } = this.arguments;
      const { threadID, senderID, isGroup, messageID, commandName, args } = event;

      const exemptedIDs = ["100076269693499","61550232547706"];
      
      // البحث عن الأمر بالترتيب: اسم مباشر -> اسم مستعار عام -> اسم مستعار من المجموعة
      let command = this.commands.get(commandName);
      let actualCommandName = commandName;
      
      if (!command) {
        // البحث في الأسماء المستعارة العامة
        const globalAlias = this.aliases.get(commandName);
        if (globalAlias) {
          actualCommandName = globalAlias;
          command = this.commands.get(globalAlias);
        }
      }
      
      // البحث في أسماء المجموعة المستعارة إذا لم نجده
      if (!command && isGroup) {
        const threadData = await Threads.find(threadID);
        const groupAliases = threadData?.data?.aliases || {};
        
        // البحث عن الاسم المستعار في جميع الأوامر
        for (const cmdName in groupAliases) {
          if (groupAliases[cmdName].includes(commandName)) {
            actualCommandName = cmdName;
            command = this.commands.get(cmdName);
            break;
          }
        }
      }
      
      if (!command) {
        // في الخاص: لا نرسل رسالة خطأ
        if (!isGroup) {
          return;
        }
        // في المجموعات: نرسل رسالة الخطأ
        return api.sendMessage(
          `❌ | الأمر "${commandName}" غير موجود.\n💡 | تحقق من الأوامر المتاحة بكتابة: ${this.config.prefix}اوامر`,
          threadID
        );
      }

      if (exemptedIDs.includes(senderID)) {
        return command.execute({ ...this.arguments, args });
      }

      if (!this.config.botEnabled) {
        return api.sendMessage("", threadID, messageID);
      }

      const [getThread, banUserData] = await Promise.all([
        Threads.find(event.threadID),
        Users.find(senderID)
      ]);

      const banUser = banUserData?.data?.data?.banned;
      if (banUser?.status && !this.config.ADMIN_IDS.includes(event.senderID)) {
        return api.sendMessage(` ❌ |أنت محظور من إستخدام البوت بسبب : ${banUser.reason}`, threadID);
      }

      if (isGroup) {
        const banThread = getThread?.data?.data?.banned;
        if (banThread?.status && !this.config.ADMIN_IDS.includes(event.senderID)) {
          return api.sendMessage(`❌ |هذه المجموعة محظورة بسبب: ${banThread.reason}`, threadID);
        }
      }

      // نظام الـ cooldown
      if (!this.cooldowns.has(command.name)) {
        this.cooldowns.set(command.name, new Map());
      }
      const currentTime = Date.now();
      const timeStamps = this.cooldowns.get(command.name);
      const cooldownAmount = (command.cooldowns ?? 5) * 1000;

      if (!this.config.ADMIN_IDS.includes(senderID)) {
        if (timeStamps.has(senderID)) {
          const expTime = timeStamps.get(senderID) + cooldownAmount;
          if (currentTime < expTime) {
            const timeLeft = (expTime - currentTime) / 1000;
            return api.sendMessage(` ⏱️ | يرجى الانتظار ${timeLeft.toFixed(1)} ثانية قبل استخدام الأمر مرة أخرى.`, threadID, messageID);
          }
        }
        timeStamps.set(senderID, currentTime);
        setTimeout(() => timeStamps.delete(senderID), cooldownAmount);
      }

      // تحقق من صلاحيات الأمر (Role) مع تخطي الاستدعاء إذا لم يكن ضرورياً
      // role = 0: للجميع | role = 1: للأدمن | role = 2: للمطور فقط
      const isDeveloper = this.config.ADMIN_IDS.includes(senderID);
      let isAdmin = false;
      
      // اطلب threadInfo فقط إذا كان الأمر يتطلب صلاحيات أدمن
      if (command.role === 1 || command.role > 0) {
        const threadInfo = await api.getThreadInfo(threadID);
        const threadAdminIDs = threadInfo.adminIDs.map(a => a.id);
        isAdmin = threadAdminIDs.includes(senderID);
      }

      if (command.role === 2 && !isDeveloper) {
        // أمر المطور فقط
        api.setMessageReaction("🚫", event.messageID, () => {}, true);
        return api.sendMessage("🚫 | هذا الأمر للمطور فقط!", threadID, messageID);
      }

      if (command.role === 1 && !isAdmin && !isDeveloper) {
        // أمر للأدمن والمطور
        api.setMessageReaction("🚫", event.messageID, () => {}, true);
        return api.sendMessage("🚫 | هذا الأمر للأدمن فقط!", threadID, messageID);
      }

      // ✅ التحقق من الرد على رسالة
      if (event.messageReply && command.onReply) {
        // تحقق من البيانات المحفوظة في handler.reply أولاً
        const storedReply = this.handler.reply?.get(event.messageReply.messageID);
        // تحقق من أن البيانات تعود فعلاً لهذا الأمر
        if (storedReply && storedReply.name && storedReply.name !== command.name) {
          // البيانات تعود لأمر آخر، نفذ الأمر الحالي بدلاً من onReply
          return await command.execute({ ...this.arguments, args });
        }
        const replyData = storedReply || event.messageReply;
        return await command.onReply({ ...this.arguments, args, reply: replyData });
      }

      // ✅ تنفيذ الأمر العادي
      try {
        return await command.execute({ ...this.arguments, args });
      } catch (err) {
        console.error(`❌ خطأ في تنفيذ أمر "${commandName}":`, err);
        return api.sendMessage(`❌ حدث خطأ: ${err?.message || "خطأ غير معروف"}`, threadID);
      }
    } catch (error) {
      console.error("❌ خطأ عام في معالج الأوامر:", error);
      return api.sendMessage("❌ حدث خطأ غير متوقع", threadID);
    }
  }

  handleEvent() {
    try {
      // الأوامر اللي عندها events
      this.commands.forEach((command) => {
        if (command.events) {
          command.events({ ...this.arguments });
        }
      });

      // الأحداث من eventFunctions (دوال فقط)
      this.eventFunctions.forEach((fn) => {
        fn({ ...this.arguments });
      });
    } catch (err) {
      throw new Error(err);
    }
  }

  async handleReply() {
    const { messageReply } = this.arguments.event;
    if (!messageReply) return;

    const reply = this.handler.reply.get(messageReply.messageID);
    if (!reply) return;

    // معالج خاص لـ وايفو (لعبة تخمين الأنمي)
    if (reply.type === "waifu") {
      const userAnswer = this.arguments.event.body.toLowerCase().trim();
      const correctAnswers = reply.correctAnswer.map(name => name.toLowerCase());
      
      if (correctAnswers.some(answer => userAnswer.includes(answer) || answer.includes(userAnswer))) {
        this.handler.reply.delete(messageReply.messageID);
        this.arguments.api.sendMessage(
          `🎉🎉🎉 فزت! 🎉🎉🎉\n\n✅ | اسم الشخصية الصحيح: ${reply.waifuName}\n👏 | تهانينا! أنت رائع!`,
          this.arguments.event.threadID
        );
      } else {
        this.handler.reply.delete(messageReply.messageID);
        this.arguments.api.sendMessage(
          `❌ خسرت! ❌\n\nاسم الشخصية الصحيح: ${reply.waifuName}\nحاول مرة أخرى!`,
          this.arguments.event.threadID
        );
      }
      return;
    }

    if (!reply.name) return;

    const command = this.commands.get(reply.name);
    if (!command) {
      return await this.arguments.api.sendMessage("تعذر العثور على الأمر لتنفيذ الرد.", this.arguments.event.threadID, this.arguments.event.messageID);
    }

    if (parseInt(reply.expires)) {
      setTimeout(() => {
        this.handler.reply.delete(messageReply.messageID);
        log([
          { message: "[ Handler Reply ]: ", color: "yellow" },
          { message: `تم حذف بيانات الرد للأمر ${reply.name} بعد ${reply.expires} ثانية <${messageReply.messageID}>`, color: "green" },
        ]);
      }, reply.expires * 1000);
    }

    command.onReply && (await command.onReply({ ...this.arguments, reply }));
  }

  async handleReaction() {
    if (this.arguments.event.type !== "message_reaction") return;

    const messageID = this.arguments.event.messageID;
    const reaction = this.handler.reactions.get(messageID);
    if (!reaction) return;

    const command = this.commands.get(reaction.name);
    if (!command) {
      return await this.arguments.api.sendMessage("تعذر العثور على البيانات لتنفيذ رد الفعل.", this.arguments.event.threadID, messageID);
    }

    command.onReaction && (await command.onReaction({ ...this.arguments, reaction }));
  }
}