import config from "../../KaguyaSetUp/config.js";

class Eval {
  constructor() {
    this.name = "eval";
    this.author = "Yamada KJ & Alastor";
    this.cooldowns = 5;
    this.description = "تنفيذ كود بسرعة";
    this.role = 2;
    this.aliases = ["eval"];
    this.hidden = true;
  }

  async execute({ api, event, args, Users, Threads }) {
    try {
      const output = (msg) => {
        if (typeof msg == "number" || typeof msg == "boolean" || typeof msg == "function") {
          msg = msg.toString();
        } else if (msg instanceof Map) {
          let text = `Map(${msg.size}) `;
          const obj = {};
          msg.forEach((v, k) => {
            obj[k] = v;
          });
          text += JSON.stringify(obj, null, 2);
          msg = text;
        } else if (typeof msg == "object") {
          msg = JSON.stringify(msg, null, 2);
        } else if (typeof msg == "undefined") {
          msg = "undefined";
        }
        api.sendMessage(msg, event.threadID);
      };

      const out = output;
      const code = args.join(" ");

      const executeCode = new Function('api', 'event', 'args', 'Users', 'Threads', 'output', 'out', `
        return (async () => {
          try {
            ${code}
          } catch(err) {
            console.error("eval error:", err);
            throw err;
          }
        })()
      `);

      await executeCode(api, event, args, Users, Threads, output, out);
    } catch (err) {
      console.error("Eval error:", err);
      api.sendMessage(`❌ خطأ:\n${err.stack || err.message}`, event.threadID, event.messageID);
    }
  }
}

export default new Eval();
