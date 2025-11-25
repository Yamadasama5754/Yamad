import fs from "fs-extra";
import { log } from "../logger/index.js";

/**
 * Middleware function to load commands and their aliases.
 */
export const commandMiddleware = async () => {
  try {
    const dir = await fs.readdir("./commands");
    for (const directory of dir) {
      if (fs.statSync(`./commands/${directory}`).isDirectory()) {
        const cmd = await fs.readdir(`./commands/${directory}`);
        for (const command of cmd) {
          // تجاهل المجلدات، حمل فقط الملفات
          if (fs.statSync(`./commands/${directory}/${command}`).isDirectory()) {
            continue;
          }
          
          try {
            const commands = (await import(`../commands/${directory}/${command}`)).default;

            if (commands?.onLoad && typeof commands?.onLoad === "function") {
              await commands.onLoad();
            }

            if (!commands?.name) {
              log([
                { message: "[ KAGUYA ]: ", color: "green" },
                { message: `Cannot load command: ${command} because it has no command name`, color: "red" },
              ]);
              continue;
            }

            if (typeof commands?.execute !== "function") {
              log([
                { message: "[ KAGUYA ]: ", color: "green" },
                { message: `Cannot load command: ${command} because it has no execute function`, color: "red" },
              ]);
              continue;
            }

            // ✅ نخزن الكائن كامل + الدالة بشكل منفصل
            global.client.commands.set(commands.name, commands); // الكائن كامل
            global.client.commandFunctions ??= new Map();
            global.client.commandFunctions.set(commands.name, commands.execute); // الدالة فقط

            await log([
              { message: "[ KAGUYA ]: ", color: "green" },
              { message: ` Kaguya Successfully loaded command: ./${directory.toLowerCase()}/${commands.name}`, color: "white" },
            ]);

            if (commands.aliases && Array.isArray(commands.aliases)) {
              for (const alias of commands.aliases) {
                if (global.client.aliases.has(alias)) {
                  log([
                    { message: "[ ALIAS ]: ", color: "ocean" },
                    { message: `Alias "${alias}" is already used for command <${global.client.aliases.get(alias)}> and cannot be used for command: ${commands.name}`, color: "red" },
                  ]);
                  continue;
                }
                if (alias == "" || !alias) continue;
                global.client.aliases.set(alias, commands.name);
              }
            }
          } catch (error) {
            log([
              { message: "[ KAGUYA ]: ", color: "green" },
              { message: `Kaguya Cannot load command: ${command} due to error: ${error}`, color: "red" },
            ]);
            continue;
          }
        }
      }
    }
  } catch (error) {
    log([
      { message: "[ KAGUYA ]: ", color: "green" },
      { message: `Kaguya Cannot load commands due to error: ${error}`, color: "red" },
    ]);
  }
};