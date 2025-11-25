import fs from "fs";
import path from "path";

const prefixFile = path.join(process.cwd(), "KaguyaSetUp/prefixes.json");

// تحميل البوادئ المخزنة
function loadPrefixes() {
  if (!fs.existsSync(prefixFile)) return {};
  return JSON.parse(fs.readFileSync(prefixFile, "utf8"));
}

// حفظ البوادئ
function savePrefixes(data) {
  fs.writeFileSync(prefixFile, JSON.stringify(data, null, 2));
}

export default {
  name: "بادئة",
  author: "Yamada KJ & Alastor",
  description: "تغيير أو عرض البادئة الحالية للمجموعة",
  role: 1,
  aliases: ["prefix"],
  cooldowns: 5,

  async execute({ api, event, args }) {
    const { threadID, isGroup } = event;

    // 🚫 منع الاستخدام في الخاص
    if (!isGroup) {
      return api.sendMessage("🚫 | هذا الأمر مخصص للمجموعات فقط.", threadID);
    }

    let prefixes = loadPrefixes();
    let currentPrefix = prefixes[threadID] !== undefined ? prefixes[threadID] : "."; // الافتراضي نقطة

    // لو كتب فقط "بادئة"
    if (args.length === 0) {
      let displayPrefix = currentPrefix === "" ? "بدون بادئة" : `"${currentPrefix}"`;
      return api.sendMessage(`🔖 | البادئة الحالية لهذه المجموعة: ${displayPrefix}`, threadID);
    }

    const action = args[0].toLowerCase();

    // تغيير البادئة
    if (action === "تغيير" && args[1]) {
      const newPrefix = args[1];
      prefixes[threadID] = newPrefix;
      savePrefixes(prefixes);
      return api.sendMessage(`✅ | تم تغيير البادئة لهذه المجموعة إلى: "${newPrefix}"`, threadID);
    }

    // إزالة البادئة (بدون بادئة)
    if (action === "بدون") {
      prefixes[threadID] = "";
      savePrefixes(prefixes);
      return api.sendMessage(`✅ | تم إزالة البادئة! البوت سيستجيب لجميع الرسائل بدون بادئة`, threadID);
    }

    // إعادة للوضع الافتراضي
    if (action === "نظام") {
      delete prefixes[threadID];
      savePrefixes(prefixes);
      return api.sendMessage(`✅ | تم إعادة البادئة للوضع الافتراضي: "."`, threadID);
    }

    return api.sendMessage(
      "❌ | استخدام غير صحيح.\nمثال:\n- .بادئة\n- .بادئة تغيير /\n- .بادئة بدون\n- .بادئة نظام",
      threadID
    );
  }
};