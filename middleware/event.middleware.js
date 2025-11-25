import fs from "fs-extra";
import { log } from "../logger/index.js";

export const eventMiddleware = async () => {
  try {
    const dir = await fs.readdir("./event");
    for (const event of dir) {
      if (!event.endsWith(".js")) continue;

      const events = (await import(`../event/${event}`)).default;

      if (events?.onLoad && typeof events?.onLoad === "function") {
        await events.onLoad();
      }

      if (!events?.name) {
        log([
          { message: "[ EVENT ]: ", color: "yellow" },
          { message: `Failed to load event: ${event} because it lacks event name`, color: "red" },
        ]);
        continue;
      }

      if (typeof events?.execute !== "function") {
        log([
          { message: "[ EVENT ]: ", color: "yellow" },
          { message: `Failed to load event: ${event} because it lacks execute function`, color: "red" },
        ]);
        continue;
      }

      // ✅ نخزن الكائن كامل + الدالة بشكل منفصل
      global.client.events.set(events.name, events); // الكائن كامل
      global.client.eventFunctions ??= new Map();
      global.client.eventFunctions.set(events.name, events.execute); // الدالة فقط

      await log([
        { message: "[ EVENT ]: ", color: "yellow" },
        { message: `Successfully loaded event: ./event/${events.name}`, color: "white" },
      ]);
    }
  } catch (error) {
    log([
      { message: "[ EVENT ]: ", color: "yellow" },
      { message: `Failed to load event due to error: ${error}`, color: "red" },
    ]);
  }
};