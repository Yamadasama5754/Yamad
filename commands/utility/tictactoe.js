class XO {
  constructor() {
    this.name = "اكس_او";
    this.author = "Yamada KJ";
    this.role = 0;
    this.version = "2.1.0";
    this.aliases = ["xo", "tic"];
    this.description = "لعبة XO ضد البوت أو ضد شخص بالمنشن/الرد";
    this.cooldowns = 5;

    this.games = new Map();
    this.gamesByMessage = new Map(); // تتبع رسائل اللعب
  }

  makeKey(threadID, p1, p2) {
    return `${threadID}_${[p1, p2].sort().join("_")}`;
  }

  renderBoard(board) {
    let str = "";
    for (let i = 0; i < 9; i++) {
      str += board[i] + ((i % 3 === 2) ? "\n" : " ");
    }
    return str;
  }

  hasWinner(board, mark) {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];
    return lines.some(([a, b, c]) => board[a] === mark && board[b] === mark && board[c] === mark);
  }

  startGame(threadID, starterID, opponentID, vsBot) {
    const key = this.makeKey(threadID, starterID, opponentID);
    if (this.games.has(key)) return { ok: false, reason: "alreadyRunning" };
    const state = {
      board: Array(9).fill("⬜"),
      players: {
        starter: { id: starterID, mark: "❌" },
        opponent: { id: opponentID, mark: "⭕" }
      },
      turn: starterID,
      vsBot
    };
    this.games.set(key, state);
    return { ok: true, state, key };
  }

  placeMove(key, playerID, pos) {
    const g = this.games.get(key);
    if (!g) return { ok: false, reason: "noGame" };
    if (g.turn !== playerID) return { ok: false, reason: "notYourTurn" };
    if (pos < 0 || pos > 8) return { ok: false, reason: "outOfRange" };
    if (g.board[pos] !== "⬜") return { ok: false, reason: "occupied" };

    const mark = (g.players.starter.id === playerID) ? g.players.starter.mark : g.players.opponent.mark;
    g.board[pos] = mark;

    if (this.hasWinner(g.board, mark)) {
      this.games.delete(key);
      return { ok: true, finished: true, winner: playerID, board: this.renderBoard(g.board) };
    }
    if (g.board.every(c => c !== "⬜")) {
      this.games.delete(key);
      return { ok: true, finished: true, draw: true, board: this.renderBoard(g.board) };
    }

    g.turn = (g.players.starter.id === playerID) ? g.players.opponent.id : g.players.starter.id;
    return { ok: true, finished: false, board: this.renderBoard(g.board), nextTurn: g.turn };
  }

  async execute({ api, event, args }) {
    const { threadID, messageID, senderID, body } = event;

    if (args.length) {
      const sub = args.join(" ").trim();
      if (sub === "عرض") {
        const sessions = [...this.games.entries()].filter(([k, g]) => k.startsWith(threadID) && (g.players.starter.id === senderID || g.players.opponent.id === senderID));
        if (!sessions.length) return api.sendMessage("❌ | لا توجد لعبة حالية لك.", threadID, messageID);
        for (const [k, g] of sessions) {
          await api.sendMessage(`🎮 | حالتك:\n${this.renderBoard(g.board)}`, threadID);
        }
        return;
      }
    }

    if (/^\d+$/.test(body?.trim() || "")) {
      const pos = parseInt(body.trim(), 10) - 1;
      const session = [...this.games.entries()].find(([k, g]) => g.turn === senderID);
      if (!session) return api.sendMessage("❌ | ليس دورك أو لا توجد لعبة.", threadID, messageID);
      const [key, g] = session;
      const result = this.placeMove(key, senderID, pos);
      if (!result.ok) {
        const reasons = {
          noGame: "❌ | لا توجد لعبة.",
          notYourTurn: "⏳ | ليس دورك.",
          outOfRange: "❌ | الرقم بين 1 و 9.",
          occupied: "❌ | الخانة مأخوذة."
        };
        return api.sendMessage(reasons[result.reason] || "❌ | خطأ غير متوقع.", threadID, messageID);
      }
      await api.sendMessage(`✅ | حركتك:\n${result.board}`, threadID);
      if (result.finished) {
        if (result.draw) return api.sendMessage("🤝 | انتهت بالتعادل!", threadID);
        return api.sendMessage(result.winner === senderID ? "🎉 | فزت!" : "😅 | خسرت!", threadID);
      }
      return api.sendMessage("✨ | الآن دور اللاعب الآخر.", threadID);
    }

    // بدء لعبة جديدة
    const mentionIDs = Object.keys(event.mentions || {});
    let opponentID = null;
    if (event.messageReply && event.messageReply.senderID !== senderID) {
      opponentID = event.messageReply.senderID;
    } else if (mentionIDs.length) {
      opponentID = mentionIDs.find(id => id !== senderID) || mentionIDs[0];
    }

    const vsBot = !opponentID;
    if (vsBot) {
      const botID = "BOT";
      const start = this.startGame(threadID, senderID, botID, true);
      if (!start.ok) return api.sendMessage("⚠️ | لديك لعبة قيد التشغيل بالفعل ضد البوت.", threadID);
      return api.sendMessage(`🎮 | لعبة XO ضد البوت 🤖\n❌ أنت، ⭕ البوت\n${this.renderBoard(start.state.board)}\n✨ | اكتب رقم من 1 إلى 9.\n✅ للإيقاف، رد بـ "إيقاف" أو "الغاء".`, threadID, (err, info) => {
        global.client.handler.reply.set(info.messageID, { key: start.key, name: this.name });
        this.gamesByMessage.set(info.messageID, { key: start.key, threadID });
      });
    } else {
      if (opponentID === senderID) return api.sendMessage("❌ | لا يمكنك تحدي نفسك 😂", threadID);
      const start = this.startGame(threadID, senderID, opponentID, false);
      if (!start.ok) return api.sendMessage("⚠️ | هناك لعبة قيد التشغيل بالفعل بينكما.", threadID);
      return api.sendMessage(`🎮 | لعبة XO بين <@${senderID}> و <@${opponentID}>\n❌ الأول، ⭕ الثاني\n${this.renderBoard(start.state.board)}\n✨ | دور <@${senderID}> الآن.\n✅ للإيقاف، رد بـ "إيقاف" أو "الغاء".`, threadID, (err, info) => {
        global.client.handler.reply.set(info.messageID, { key: start.key, name: this.name });
        this.gamesByMessage.set(info.messageID, { key: start.key, threadID });
      });
    }
  }

  async onReply({ api, event, reply }) {
    const { threadID, messageID, body, senderID } = event;
    if (!reply.key) return;
    const choice = body.trim();
    if (choice === "إيقاف" || choice === "الغاء") {
      const ok = this.games.delete(reply.key);
      return api.sendMessage(ok ? "✅ | تم إنهاء اللعبة." : "❌ | لا توجد لعبة لإيقافها.", threadID, messageID);
    }

    // معالجة الحركات في الرد
    if (/^\d+$/.test(choice)) {
      const pos = parseInt(choice, 10) - 1;
      const result = this.placeMove(reply.key, senderID, pos);
      if (!result.ok) {
        const reasons = {
          noGame: "❌ | لا توجد لعبة.",
          notYourTurn: "⏳ | ليس دورك.",
          outOfRange: "❌ | الرقم بين 1 و 9.",
          occupied: "❌ | الخانة مأخوذة."
        };
        return api.sendMessage(reasons[result.reason] || "❌ | خطأ غير متوقع.", threadID, messageID);
      }
      await api.sendMessage(`✅ | حركتك:\n${result.board}`, threadID);
      if (result.finished) {
        if (result.draw) return api.sendMessage("🤝 | انتهت بالتعادل!", threadID);
        return api.sendMessage(result.winner === senderID ? "🎉 | فزت!" : "😅 | خسرت!", threadID);
      }
      return api.sendMessage("✨ | الآن دور اللاعب الآخر.", threadID);
    }
  }
}

export default new XO();
