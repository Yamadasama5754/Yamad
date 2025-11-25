import config from '../KaguyaSetUp/config.js';

const DEVELOPERS = config.ADMIN_IDS || [];

async function execute({ api, event }) {
  // تعطيل فحص الأمان - البوت الآن يقبل الإضافة من الجميع
}

export default {
  name: "bot-security-check",
  description: "فحص أمان عند بدء البوت للتحقق من المجموعات المصرحة",
  execute,
};
