import mongoose from "mongoose";
import config from "../KaguyaSetUp/config.js";
import { log } from "../logger/index.js";
import fs from "fs";

(async () => {
  switch (config.database.type) {
    case "mongodb":
      {
        try {
          await mongoose.connect(config.database.mongodb.uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
          });
          log([
            {
              message: "[ DATABASE ]: ",
              color: "green",
            },
            {
              message: "Successfully connected to the database",
              color: "white",
            },
          ]);
        } catch (error) {
          console.log(error);
          log([
            {
              message: "[ DATABASE ]: ",
              color: "red",
            },
            {
              message: "Unable to connect to the database",
              color: "white",
            },
          ]);
          process.exit(0);
        }
      }
      break;
    case "json":
      {
        const createIfNotExists = (path) => {
          if (!fs.existsSync(path)) fs.writeFileSync(path, "[]");
        };

        createIfNotExists("./database/users.json");
        createIfNotExists("./database/threads.json");

        log([
          {
            message: "[ DATABASE ]: ",
            color: "green",
          },
          {
            message: "Connected to JSON database",
            color: "white",
          },
        ]);
      }
      break;
  }
})();
            