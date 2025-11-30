export default {
  "prefix": ".",
  "BOT_NAME": "✿❀ 𝑴𝒊𝒓𝒂𝒊 ❀✿",
  "ADMIN_IDS": [
    "100092990751389",
    "61578918847847"
  ],
  "botEnabled": true,
  "autogreet": true,
  "options": {
    "forceLogin": true,
    "listenEvents": true,
    "listenTyping": true,
    "logLevel": "silent",
    "updatePresence": true,
    "selfListen": true,
    "usedDatabase": false
  },
  "database": {
    "type": "json",
    "mongodb": {
      "uri": "mongodb://0.0.0.0:27017"
    }
  },
  "port": 3000,
  "mqtt_refresh": 1200000
};