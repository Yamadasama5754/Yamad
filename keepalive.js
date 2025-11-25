import axios from "axios";

// تتبع وقت بدء البوت
export const initBotStartTime = () => {
  if (!global.botStartTime) {
    global.botStartTime = Date.now();
  }
};

let pingFailCount = 0;
const MAX_PING_FAILS = 10;

// 🔄 Keep-Alive Task
function startKeepAlive() {
  const PING_INTERVAL = 60 * 1000; // ✅ 1 دقيقة بدل 3 (أقوي للـ uptime)
  const MEMORY_CHECK = 2 * 60 * 1000; // فحص الذاكرة كل دقيقتين

  console.log("🟢 Keep-Alive started - سيرسل ping كل دقيقة واحدة");
  initBotStartTime();

  // أول ping مباشرة
  sendPing();

  // ping دوري
  const pingInterval = setInterval(sendPing, PING_INTERVAL);

  // فحص الذاكرة
  const memoryInterval = setInterval(() => {
    try {
      const mem = process.memoryUsage();
      const heapUsedPercent = (mem.heapUsed / mem.heapTotal) * 100;
      
      if (heapUsedPercent > 85) {
        console.warn(`⚠️ High memory usage: ${heapUsedPercent.toFixed(2)}%`);
        if (global.gc) {
          global.gc();
          console.log("✅ Garbage collection triggered");
        }
      }
    } catch (err) {
      console.error("Memory check error:", err.message);
    }
  }, MEMORY_CHECK);

  // تحقق من وقت البوت كل ساعة
  const uptimeInterval = setInterval(() => {
    try {
      if (global.botStartTime) {
        const uptime = Date.now() - global.botStartTime;
        const hours = Math.floor(uptime / 1000 / 3600);
        const minutes = Math.floor((uptime / 1000 / 60) % 60);
        console.log(`📊 Bot running for ${hours}h ${minutes}m`);
      }
    } catch (err) {
      console.error("Uptime check error:", err.message);
    }
  }, 60 * 60 * 1000);

  // Prevent intervals from keeping the process alive unexpectedly
  pingInterval.unref?.();
  memoryInterval.unref?.();
  uptimeInterval.unref?.();
}

function sendPing() {
  const client = axios.create({
    timeout: 5000,
    httpAgent: { keepAlive: true, keepAliveMsecs: 30000 },
    httpsAgent: { keepAlive: true, keepAliveMsecs: 30000 }
  });

  // ✅ جرّب localhost أولاً، ثم الـ external URL كـ fallback
  const pingUrls = [
    `http://localhost:3000/health`,
    `http://127.0.0.1:3000/health`
  ];

  // محاولة جميع الـ URLs
  let attempts = 0;
  const tryNextUrl = () => {
    if (attempts >= pingUrls.length) {
      pingFailCount++;
      console.warn(`⚠️ All ping attempts failed (${pingFailCount}/${MAX_PING_FAILS})`);
      
      if (pingFailCount >= MAX_PING_FAILS) {
        console.error("❌ Multiple ping failures - Bot may be unresponsive");
        pingFailCount = Math.max(0, pingFailCount - 3); // Reset partially
      }
      return;
    }

    const url = pingUrls[attempts];
    attempts++;

    client
      .get(url)
      .then((response) => {
        pingFailCount = 0; // ✅ Reset on success
        console.log(`✅ Keep-Alive Ping OK at ${new Date().toLocaleTimeString("ar-SA")} [${response.status}]`);
      })
      .catch((err) => {
        const errorMsg = err.code || err.message || "Unknown error";
        console.warn(`⚠️ Ping attempt ${attempts} failed: ${errorMsg}`);
        tryNextUrl();
      });
  };

  tryNextUrl();
}

// معالج الأخطاء العام
process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err.message);
  console.error("Stack:", err.stack);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection:", reason);
});

// Monitor memory leaks
let lastMemory = 0;
setInterval(() => {
  try {
    const currentMemory = process.memoryUsage().heapUsed;
    const memoryGrowth = currentMemory - lastMemory;
    
    if (memoryGrowth > 50 * 1024 * 1024) { // 50MB growth
      console.warn(`⚠️ Memory growing fast: +${(memoryGrowth / 1024 / 1024).toFixed(2)}MB`);
    }
    lastMemory = currentMemory;
  } catch (err) {
    // Ignore monitoring errors
  }
}, 30 * 1000); // Every 30 seconds

export default startKeepAlive;
