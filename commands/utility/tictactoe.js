class XO {
  constructor() {
    this.name = "اكس_او";
    this.author = "Yamada KJ";
    this.role = 0;
    this.version = "2.3.0";
    this.aliases = ["xo", "tic", "تحدي"];
    this.description = "لعبة XO ضد البوت أو ضد شخص بالمنشن/الرد";
    this.cooldowns = 5;

    this.games = new Map();
    this.gamesByMessage = new Map();
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

  // AI بسيطة للبوت
  getBotMove(board) {
    // 1️⃣ محاولة الفوز
    for (let i = 0; i < 9; i++) {
      if (board[i] === "⬜") {
        board[i] = "⭕";
        if (this.hasWinner(board, "⭕")) {
          board[i] = "⬜";
          return i;
        }
        board[i] = "⬜";
      }
    }

    // 2️⃣ محاولة حجب اللاعب
    for (let i = 0; i < 9; i++) {
      if (board[i] === "⬜") {
        board[i] = "❌";
        if (this.hasWinner(board, "❌")) {
          board[i] = "⬜";
          return i;
        }
        board[i] = "⬜";
      }
    }

    // 3️⃣ أخذ الوسط
    if (board[4] === "⬜") return 4;

    // 4️⃣ أخذ الزوايا
    const corners = [0, 2, 6, 8];
    const emptyCorners = corners.filter(i => board[i] === "⬜");
    if (emptyCorners.length > 0) {
      return emptyCorners[Math.floor(Math.random() * emptyCorners.length)];
    }

    // 5️⃣ أخذ أي خانة متاحة
    const empty = board
      .map((c, i) => (c === "⬜" ? i : null))
      .filter(i => i !== null);
    return empty[Math.floor(Math.random() * empty.length)];
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
    const { threadID, messageID, senderID } = event;

    // أوامر فرعية فقط
    if (args.length) {
      const sub = args.join(" ").trim();
      if (sub === "عرض" || sub === "show") {
        const sessions = [...this.games.entries()].filter(([k, g]) => 
          k.startsWith(threadID) && (g.players.starter.id === senderID || g.players.opponent.id === senderID)
        );
        if (!sessions.length) {
          return api.sendMessage("❌ | لا توجد لعبة حالية لك.", threadID, messageID);
        }
        for (const [k, g] of sessions) {
          await api.sendMessage(
            `🎮 | حالتك الحالية:\n${this.renderBoard(g.board)}\n⏳ | دور: ${g.turn === senderID ? "أنت 👈" : "الخصم 👈"}`,
            threadID
          );
        }
        return;
      }
      if (sub === "مساعدة" || sub === "help") {
        return api.sendMessage(
          `🎮 | مساعدة اكس او\n━━━━━━━━━━━━━━\n` +
          `.اكس او - لعبة ضد البوت\n` +
          `.اكس او @احمد - لعبة مع احمد\n` +
          `رد على رسالة + .اكس او - تحدي المرسل\n` +
          `.اكس او عرض - عرض ألعابك\n` +
          `\n📍 الحركات: رد على رسالة اللعبة برقم 1-9\n` +
          `✅ الإيقاف: رد بـ "إيقاف" أو "الغاء"`,
          threadID,
          messageID
        );
      }
    }

    // بدء لعبة جديدة فقط
    const mentionIDs = Object.keys(event.mentions || {});
    let opponentID = null;

    // 1️⃣ التحقق من الرد على شخص
    if (event.messageReply && event.messageReply.senderID !== senderID) {
      opponentID = event.messageReply.senderID;
    }
    // 2️⃣ التحقق من المنشنات
    else if (mentionIDs.length) {
      opponentID = mentionIDs.find(id => id !== senderID) || mentionIDs[0];
    }

    const vsBot = !opponentID;

    if (vsBot) {
      const botID = "BOT";
      const start = this.startGame(threadID, senderID, botID, true);
      if (!start.ok) {
        return api.sendMessage("⚠️ | لديك لعبة قيد التشغيل بالفعل ضد البوت! 🤖", threadID);
      }
      return api.sendMessage(
        `🎮 لعبة XO ضد البوت 🤖\n━━━━━━━━━━━━━━\n` +
        `❌ أنت، ⭕ البوت\n\n` +
        `${this.renderBoard(start.state.board)}\n\n` +
        `✨ | رد على هذه الرسالة برقم من 1 إلى 9\n` +
        `📍 | للإيقاف رد بـ "إيقاف"`,
        threadID,
        (err, info) => {
          if (info) {
            global.client.handler.reply.set(info.messageID, { key: start.key, name: this.name });
            this.gamesByMessage.set(info.messageID, { key: start.key, threadID });
          }
        }
      );
    } else {
      if (opponentID === senderID) {
        return api.sendMessage("❌ | لا يمكنك تحدي نفسك! 😂", threadID);
      }
      const start = this.startGame(threadID, senderID, opponentID, false);
      if (!start.ok) {
        return api.sendMessage("⚠️ | هناك لعبة قيد التشغيل بالفعل بينكما!", threadID);
      }
      return api.sendMessage(
        `🎮 لعبة XO بين لاعبين\n━━━━━━━━━━━━━━\n` +
        `<@${senderID}> ❌ (الأول)\n` +
        `<@${opponentID}> ⭕ (الثاني)\n\n` +
        `${this.renderBoard(start.state.board)}\n\n` +
        `✨ | دور <@${senderID}> الآن\n` +
        `📍 | للإيقاف رد على هذه الرسالة بـ "إيقاف"`,
        threadID,
        (err, info) => {
          if (info) {
            global.client.handler.reply.set(info.messageID, { key: start.key, name: this.name });
            this.gamesByMessage.set(info.messageID, { key: start.key, threadID });
          }
        }
      );
    }
  }

  async onReply({ api, event, reply }) {
    const { threadID, messageID, body, senderID } = event;
    if (!reply.key) return;

    const choice = body.trim();

    // إيقاف اللعبة
    if (choice === "إيقاف" || choice === "الغاء" || choice === "stop" || choice === "cancel") {
      const ok = this.games.delete(reply.key);
      return api.sendMessage(
        ok ? "✅ | تم إنهاء اللعبة بنجاح." : "❌ | لا توجد لعبة نشطة لإيقافها.",
        threadID,
        messageID
      );
    }

    // معالجة الحركات في الرد فقط
    if (!/^\d+$/.test(choice)) {
      return api.sendMessage("❌ | اكتب رقم من 1 إلى 9 فقط!", threadID, messageID);
    }

    const pos = parseInt(choice, 10) - 1;
    const g = this.games.get(reply.key);
    if (!g) {
      return api.sendMessage("❌ | لا توجد لعبة نشطة.", threadID, messageID);
    }

    // التحقق من دور اللاعب
    if (g.turn !== senderID) {
      return api.sendMessage("⏳ | ليس دورك حالياً!", threadID, messageID);
    }

    const result = this.placeMove(reply.key, senderID, pos);
    if (!result.ok) {
      const reasons = {
        noGame: "❌ | لا توجد لعبة.",
        notYourTurn: "⏳ | ليس دورك حالياً.",
        outOfRange: "❌ | الرقم يجب أن يكون بين 1 و 9.",
        occupied: "❌ | هذه الخانة مأخوذة بالفعل."
      };
      return api.sendMessage(reasons[result.reason] || "❌ | خطأ غير متوقع.", threadID, messageID);
    }

    await api.sendMessage(`✅ | حركتك:\n${result.board}`, threadID);

    if (result.finished) {
      if (result.draw) {
        return api.sendMessage("🤝 | انتهت اللعبة بالتعادل! 🎲", threadID);
      }
      const winner = result.winner === senderID ? "أنت 🎉" : "الخصم 😅";
      return api.sendMessage(`🏆 | انتهت اللعبة - الفائز: ${winner}`, threadID);
    }

    // إذا كان دور البوت
    if (g.vsBot && g.turn === "BOT") {
      await new Promise(resolve => setTimeout(resolve, 1000)); // تأخير 1 ثانية للطبيعية
      
      const botMove = this.getBotMove(g.board);
      const botResult = this.placeMove(reply.key, "BOT", botMove);
      
      await api.sendMessage(`🤖 | حركة البوت:\n${botResult.board}`, threadID);
      
      if (botResult.finished) {
        if (botResult.draw) {
          return api.sendMessage("🤝 | انتهت اللعبة بالتعادل! 🎲", threadID);
        }
        const winner = botResult.winner === "BOT" ? "البوت 😅" : "أنت 🎉";
        return api.sendMessage(`🏆 | انتهت اللعبة - الفائز: ${winner}`, threadID);
      }
      
      return api.sendMessage("✨ | الآن دورك...", threadID);
    }

    return api.sendMessage("✨ | الآن دور اللاعب الآخر...", threadID);
  }
}

export default new XO();
