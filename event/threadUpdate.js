import { log } from "../logger/index.js";

export default {
  name: "threadUpdate",
  execute: async ({ api, event, Threads }) => {
    try {
      console.log(`[ThreadUpdate] Event type: ${event.logMessageType}`, event.logMessageData);
      
      const threadsData = await Threads.find(event.threadID);
      const threads = threadsData?.data || {};

      if (!threads) {
        await Threads.create(event.threadID);
        return;
      }

      if (!Object.keys(threads).length) return;

      const eventType = event.logMessageType || "";

      if (eventType.includes("thread-name") || eventType.includes("name")) {
        await handleThreadName(api, event, Threads, threads);
      } else if (eventType.includes("admin")) {
        await handleAdminChange(api, event, Threads, threads);
      } else if (eventType.includes("approval")) {
        await handleApprovalModeChange(api, event, Threads, threads);
      } else if (eventType.includes("icon") || eventType.includes("image") || eventType.includes("photo") || eventType.includes("thread-icon")) {
        await handleThreadIconChange(api, event, Threads, threads);
      } else if (eventType.includes("nickname") || eventType.includes("user-nickname")) {
        await handleNicknameChange(api, event, Threads, threads);
      } else if (eventType.includes("emoji")) {
        await handleThreadEmoji(api, event, Threads, threads);
      } else if (eventType.includes("description") || eventType.includes("desc")) {
        await handleThreadDescription(api, event, Threads, threads);
      }
    } catch (error) {
      console.error("Error handling thread update:", error);
    }
  },
};

async function handleNicknameChange(api, event, Threads, threads) {
  const data = event.logMessageData || {};
  const userID = data.userID || data.targetID || data.participant_id || event.author;
  const newNickname = data.newNickname || data.nickname || "";

  console.log(`[Nickname] UserID: ${userID}, Nickname: ${newNickname}, Protection: ${threads.anti?.nicknameBox}`);

  if (!userID) {
    console.log("[Nickname] No userID found, skipping");
    return;
  }

  if (threads.anti?.nicknameBox) {
    try {
      const oldNickname = threads.data?.oldNicknames?.[userID] || "";
      console.log(`[Nickname] Reverting to: ${oldNickname}`);
      await api.setUserNickname(userID, oldNickname);
    } catch (err) {
      console.error("Error reverting nickname:", err);
    }
    return api.sendMessage(
      `❌ | ميزة حماية الكنية مفعلة، لذا لم يتم تغيير كنية العضو 🔖`,
      event.threadID
    );
  }

  threads.data = threads.data || {};
  threads.data.oldNicknames = threads.data.oldNicknames || {};
  threads.data.oldNicknames[userID] = newNickname;

  await Threads.update(event.threadID, {
    data: threads.data,
  });

  const adminName = await getUserName(api, event.author);
  api.sendMessage(
    `تم تغيير كنية العضو إلى: ${newNickname} 🔖 | بواسطة: ${adminName}`,
    event.threadID
  );
}

async function handleThreadName(api, event, Threads, threads) {
  const data = event.logMessageData || {};
  const newName = data.name || data.newName || "";

  console.log(`[ThreadName] New name: ${newName}, Protection: ${threads.anti?.nameBox}`);

  if (!newName) {
    console.log("[ThreadName] No name found, skipping");
    return;
  }

  if (threads.anti?.nameBox) {
    const savedName = threads.anti.savedName || threads.name;
    if (savedName) {
      try {
        console.log(`[ThreadName] Reverting to: ${savedName}`);
        await api.setTitle(savedName, event.threadID);
      } catch (err) {
        console.error("Error restoring thread name:", err);
      }
      return api.sendMessage(
        `❌ | ميزة حماية الاسم مفعلة، لذا تم إرجاع اسم المجموعة 📝`,
        event.threadID
      );
    }
  }

  await Threads.update(event.threadID, {
    name: newName,
  });

  const adminName = await getUserName(api, event.author);
  api.sendMessage(
    `تم تغيير الاسم الجديد للمجموعة إلى: 『${newName}』 بواسطة: ${adminName}`,
    event.threadID
  );
}

async function handleAdminChange(api, event, Threads, threads) {
  const data = event.logMessageData || {};
  const adminIDs = threads.adminIDs || [];
  const TARGET_ID = data.TARGET_ID || data.targetID;
  const ADMIN_EVENT = data.ADMIN_EVENT || data.adminEvent;

  if (!TARGET_ID || !ADMIN_EVENT) return;

  if (ADMIN_EVENT === "add_admin" && !adminIDs.includes(TARGET_ID)) {
    adminIDs.push(TARGET_ID);
  }

  if (ADMIN_EVENT === "remove_admin") {
    const indexOfTarget = adminIDs.indexOf(TARGET_ID);
    if (indexOfTarget > -1) {
      adminIDs.splice(indexOfTarget, 1);
    }
  }

  await Threads.update(event.threadID, {
    adminIDs,
  });

  const action = ADMIN_EVENT === "add_admin" ? "✅ إضافة" : "❌ إزالة";
  const adminName = await getUserName(api, TARGET_ID);
  api.sendMessage(
    `🔖 | تمت ${action} ${adminName} كآدمن في المجموعة`,
    event.threadID
  );
}

async function handleApprovalModeChange(api, event, Threads, threads) {
  const data = event.logMessageData || {};
  const APPROVAL_MODE = data.APPROVAL_MODE || data.approvalMode;

  await Threads.update(event.threadID, {
    approvalMode: APPROVAL_MODE === 0 ? false : true,
  });

  const action = APPROVAL_MODE === 0 ? "تفعيل" : "تعطيل";
  api.sendMessage(
    `تم ${action} ميزة الموافقة في المجموعة 🔖`,
    event.threadID
  );
}

async function handleThreadIconChange(api, event, Threads, threads) {
  const data = event.logMessageData || {};

  console.log(`[ThreadImage] Protection: ${threads.anti?.imageBox}, Saved: ${threads.anti?.savedImage}`);

  if (threads.anti?.imageBox) {
    // عند أول محاولة تغيير، نحفظ الصورة الحالية
    if (!threads.anti.savedImage) {
      try {
        const threadInfo = await api.getThreadInfo(event.threadID);
        const threadData = threadInfo?.[event.threadID];
        
        // حفظ الصورة الحالية (قبل التغيير)
        const currentImage = threadData?.imageSrc || threadData?.image || threadData?.photo || event.threadID;
        threads.anti.savedImage = currentImage;
        
        await Threads.update(event.threadID, {
          anti: threads.anti
        });
        
        console.log(`[ThreadImage] تم حفظ الصورة الحالية: ${currentImage}`);
      } catch (err) {
        console.error("[ThreadImage] Error saving current image:", err.message);
      }
    }
    
    // الآن حاول إرجاع الصورة المحفوظة
    if (threads.anti.savedImage) {
      console.log(`[ThreadImage] محاولة إرجاع الصورة المحفوظة`);
      try {
        await api.changeThreadImage(threads.anti.savedImage, event.threadID);
        console.log(`[ThreadImage] نجح إرجاع الصورة`);
      } catch (err) {
        console.error("[ThreadImage] خطأ في إرجاع الصورة:", err.message);
      }
    }
    
    api.sendMessage(
      `🔒 | ميزة حماية الصورة مفعلة\n❌ تم منع تغيير صورة المجموعة وإرجاع الصورة السابقة`,
      event.threadID
    );
    return;
  }

  const adminName = await getUserName(api, event.author);
  api.sendMessage(
    `تم تغيير صورة المجموعة بواسطة: ${adminName}`,
    event.threadID
  );
}

async function handleThreadEmoji(api, event, Threads, threads) {
  const data = event.logMessageData || {};
  const newEmoji = data.emoji;

  if (!newEmoji) return;

  const adminName = await getUserName(api, event.author);

  if (threads.anti?.emojiBox && !threads.anti.savedEmoji && newEmoji) {
    threads.anti.savedEmoji = newEmoji;
    await Threads.update(event.threadID, {
      anti: threads.anti
    });
  }

  if (threads.anti?.emojiBox) {
    const savedEmoji = threads.anti.savedEmoji;
    if (savedEmoji) {
      try {
        await api.setThreadEmoji(savedEmoji, event.threadID);
      } catch (err) {
        console.error("Error restoring thread emoji:", err);
      }
      return api.sendMessage(
        `❌ | ميزة حماية emoji مفعلة، لذا تم إرجاع emoji 😀`,
        event.threadID
      );
    }
  }

  api.sendMessage(
    `تم تغيير emoji المجموعة بواسطة: ${adminName}`,
    event.threadID
  );
}

async function handleThreadDescription(api, event, Threads, threads) {
  const data = event.logMessageData || {};
  const newDesc = data.description || data.desc;

  if (!newDesc) return;

  const adminName = await getUserName(api, event.author);

  if (threads.anti?.descriptionBox && !threads.anti.savedDescription && newDesc) {
    threads.anti.savedDescription = newDesc;
    await Threads.update(event.threadID, {
      anti: threads.anti
    });
  }

  if (threads.anti?.descriptionBox) {
    const savedDesc = threads.anti.savedDescription;
    if (savedDesc) {
      try {
        await api.setThreadDescription(savedDesc, event.threadID);
      } catch (err) {
        console.error("Error restoring thread description:", err);
      }
      return api.sendMessage(
        `❌ | ميزة حماية الوصف مفعلة، لذا تم إرجاع الوصف 📋`,
        event.threadID
      );
    }
  }

  api.sendMessage(
    `تم تغيير وصف المجموعة بواسطة: ${adminName}`,
    event.threadID
  );
}

async function getUserName(api, userID) {
  try {
    if (!userID) return "Unknown";
    const userInfo = await api.getUserInfo(userID);
    return userInfo?.[userID]?.name || "Unknown";
  } catch (err) {
    return "Unknown";
  }
}
