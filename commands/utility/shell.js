import { exec } from "child_process";
import { promisify } from "util";

const execPromise = promisify(exec);

class Shell {
  constructor() {
    this.name = "كمند";
    this.author = "Yamada KJ & Alastor";
    this.cooldowns = 10;
    this.description = "تنفيذ أوامر shell (للمطورين فقط)";
    this.role = 2;
    this.aliases = ["كمند", "shell", "sh"];
  }

  async execute({ api, event, args }) {
    if (args.length === 0) {
      return api.sendMessage(
        "❌ أدخل الأمر المراد تنفيذه",
        event.threadID,
        event.messageID
      );
    }

    const command = args.join(" ");

    // Forbidden patterns to prevent dangerous commands
    const forbiddenPatterns = [
      /rm\s+-rf\s+\/[^/\s]*/gi,
      /:\(\)\{\s*:\|:&\s*\};:/gi,
      /mkfs/gi,
      /dd\s+if=/gi,
      />\/dev\/(sd|hd|nvme)/gi,
      /chmod\s+777/gi
    ];

    for (const pattern of forbiddenPatterns) {
      if (pattern.test(command)) {
        return api.sendMessage(
          "⛔ تم اكتشاف أمر خطر وتم حظره",
          event.threadID,
          event.messageID
        );
      }
    }

    api.sendMessage(
      "⏳ جاري التنفيذ...",
      event.threadID
    );

    try {
      const { stdout, stderr } = await execPromise(command, {
        maxBuffer: 1024 * 1024,
        env: { ...process.env, NODE_ENV: "shell_execution" }
      });

      let output = stdout || stderr || "تم تنفيذ الأمر بدون إخراج";

      if (output.length > 2000) {
        output = output.substring(0, 2000) + "\n... (تم القطع)";
      }

      // Redact sensitive information
      const redactedOutput = output
        .replace(/([A-Za-z0-9+/=]{40,})/g, "[REDACTED_SECRET]")
        .replace(/(password|token|key|secret|api[-_]?key)[\s:=]+[^\s]*/gi, "$1=[REDACTED]");

      return api.sendMessage(
        `✓ النتيجة:\n\n${redactedOutput}`,
        event.threadID
      );
    } catch (err) {
      if (err.killed) {
        return api.sendMessage(
          "❌ تم إيقاف الأمر",
          event.threadID,
          event.messageID
        );
      }

      let errorMsg = err.message || err.stderr || err.toString();

      if (errorMsg.length > 2000) {
        errorMsg = errorMsg.substring(0, 2000) + "\n... (تم القطع)";
      }

      return api.sendMessage(
        `✗ خطأ:\n\n${errorMsg}`,
        event.threadID,
        event.messageID
      );
    }
  }
}

export default new Shell();
