import { execSync } from "child_process";

try {
  const status = execSync("git status --porcelain").toString();

  if (status.trim()) {
    execSync("git add .");
    execSync('git commit -m "تحديث تلقائي من البوت في Render"');
    execSync("git push");
    console.log("✅ تم رفع التعديلات إلى GitHub");
  } else {
    console.log("ℹ️ لا توجد تغييرات");
  }
} catch (err) {
  console.error("❌ خطأ أثناء الدفع:", err.message);
}