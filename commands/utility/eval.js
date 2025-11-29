import config from "../../KaguyaSetUp/config.js";
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class CodeExecutor {
  constructor() {
    this.name = "تنفيذ";
    this.author = "Yamada KJ & Enhanced";
    this.cooldowns = 5;
    this.description = "تنفيذ أكواد JavaScript, Python, Node.js - الاستخدام: .تنفيذ js|console.log('test') أو .تنفيذ py|print('test')";
    this.role = 2;
    this.aliases = ["تنفيذ", "execute"];
    this.hidden = false;
  }

  async execute({ api, event, args }) {
    try {
      const fullCode = args.join(" ");
      
      if (!fullCode) {
        return api.sendMessage(
          `❌ استخدام خاطئ!\n\nالطرق المدعومة:\n1️⃣ .تنفيذ js|كود جفاسكريبت\n2️⃣ .تنفيذ py|كود بايثون\n3️⃣ .تنفيذ node|كود نود جس\n\nمثال:\n.تنفيذ js|console.log(2+2)`,
          event.threadID
        );
      }

      const [language, ...codeParts] = fullCode.split('|');
      const code = codeParts.join('|').trim();

      if (!code) {
        return api.sendMessage(
          `❌ الرجاء كتابة الكود بعد |`,
          event.threadID
        );
      }

      let result = '';
      const lang = language.toLowerCase().trim();

      if (lang === 'js' || lang === 'javascript') {
        result = await this.executeJavaScript(code, api, event);
      } else if (lang === 'py' || lang === 'python') {
        result = await this.executePython(code);
      } else if (lang === 'node' || lang === 'nodejs') {
        result = await this.executeNode(code, api, event);
      } else {
        return api.sendMessage(
          `❌ لغة غير معروفة!\nاللغات المدعومة: js, py, node`,
          event.threadID
        );
      }

      // تقليص النتيجة إذا كانت طويلة
      if (result.length > 2000) {
        result = result.substring(0, 1997) + "...";
      }

      api.sendMessage(
        `✅ النتيجة:\n\n${result || '(بدون مخرجات)'}`,
        event.threadID
      );

    } catch (err) {
      const errorMsg = err.message || err.toString();
      const displayError = errorMsg.length > 1000 ? 
        errorMsg.substring(0, 997) + "..." : 
        errorMsg;

      console.error("Executor error:", err);
      api.sendMessage(
        `❌ خطأ في التنفيذ:\n${displayError}`,
        event.threadID
      );
    }
  }

  async executeJavaScript(code, api, event) {
    try {
      const output = [];
      
      // إنشاء نسخة من console.log
      const customConsole = {
        log: (...args) => {
          output.push(args.map(arg => this.formatOutput(arg)).join(' '));
        },
        error: (...args) => {
          output.push('ERROR: ' + args.map(arg => this.formatOutput(arg)).join(' '));
        },
        warn: (...args) => {
          output.push('WARN: ' + args.map(arg => this.formatOutput(arg)).join(' '));
        }
      };

      const executeCode = new Function(
        'console', 'api', 'event', 
        `return (async () => {
          try {
            ${code}
          } catch(err) {
            throw err;
          }
        })()`
      );

      await executeCode(customConsole, api, event);
      return output.length > 0 ? output.join('\n') : '(بدون مخرجات)';

    } catch (err) {
      throw new Error(`JavaScript Error: ${err.message}`);
    }
  }

  async executePython(code) {
    try {
      const tempFile = path.join('/tmp', `python_${Date.now()}_${Math.random().toString(36).substring(7)}.py`);
      
      try {
        fs.writeFileSync(tempFile, code);
        const result = execSync(`python3 "${tempFile}"`, { 
          timeout: 10000,
          encoding: 'utf-8',
          stdio: ['pipe', 'pipe', 'pipe']
        });
        return result || '(بدون مخرجات)';
      } finally {
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
        }
      }

    } catch (err) {
      if (err.status) {
        const stderr = err.stderr ? err.stderr.toString() : '';
        const stdout = err.stdout ? err.stdout.toString() : '';
        throw new Error(`Python Error:\n${stderr || stdout || err.message}`);
      }
      throw new Error(`Python Error: ${err.message}`);
    }
  }

  async executeNode(code, api, event) {
    try {
      const output = [];
      
      const customConsole = {
        log: (...args) => {
          output.push(args.map(arg => this.formatOutput(arg)).join(' '));
        },
        error: (...args) => {
          output.push('ERROR: ' + args.map(arg => this.formatOutput(arg)).join(' '));
        },
        warn: (...args) => {
          output.push('WARN: ' + args.map(arg => this.formatOutput(arg)).join(' '));
        }
      };

      const executeCode = new Function(
        'console', 'api', 'event', 
        `return (async () => {
          ${code}
        })()`
      );

      await executeCode(customConsole, api, event);
      return output.length > 0 ? output.join('\n') : '(بدون مخرجات)';

    } catch (err) {
      throw new Error(`Node.js Error: ${err.message}`);
    }
  }

  formatOutput(value) {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'boolean') return value.toString();
    if (typeof value === 'number') return value.toString();
    if (typeof value === 'string') return value;
    if (typeof value === 'function') return `[Function: ${value.name || 'anonymous'}]`;
    
    if (value instanceof Map) {
      const obj = {};
      value.forEach((v, k) => {
        obj[k] = v;
      });
      return JSON.stringify(obj, null, 2);
    }
    
    if (value instanceof Set) {
      return JSON.stringify(Array.from(value), null, 2);
    }
    
    if (value instanceof Error) {
      return `${value.name}: ${value.message}`;
    }
    
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value, null, 2);
      } catch (e) {
        return value.toString();
      }
    }
    
    return String(value);
  }
}

export default new CodeExecutor();
