class TicTacToe {
  constructor() {
    this.name = "اكس_او";
    this.author = "Yamada KJ & Alastor - Enhanced";
    this.cooldowns = 3;
    this.description = "🎮 لعبة اكس او | الاستخدام: اكس او (اختر الوضع) أو اكس او @شخص";
    this.role = 0;
    this.aliases = ["xo", "tic", "tictactoe"];
  }

  createBoard() {
    return [
      ['1️⃣', '2️⃣', '3️⃣'],
      ['4️⃣', '5️⃣', '6️⃣'],
      ['7️⃣', '8️⃣', '9️⃣']
    ];
  }

  displayBoard(board) {
    let display = "╭─────────╮\n";
    for (let i = 0; i < 3; i++) {
      display += `│ ${board[i][0]} ${board[i][1]} ${board[i][2]} │\n`;
    }
    display += "╰─────────╯";
    return display;
  }

  checkWinner(board, player) {
    const symbol = player === 'X' ? '❌' : '⭕';
    
    for (let i = 0; i < 3; i++) {
      if (board[i][0] === symbol && board[i][1] === symbol && board[i][2] === symbol) {
        return true;
      }
    }
    
    for (let i = 0; i < 3; i++) {
      if (board[0][i] === symbol && board[1][i] === symbol && board[2][i] === symbol) {
        return true;
      }
    }
    
    if (board[0][0] === symbol && board[1][1] === symbol && board[2][2] === symbol) {
      return true;
    }
    if (board[0][2] === symbol && board[1][1] === symbol && board[2][0] === symbol) {
      return true;
    }
    
    return false;
  }

  isBoardFull(board) {
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (board[i][j].includes('️⃣')) {
          return false;
        }
      }
    }
    return true;
  }

  getAvailableMoves(board) {
    const moves = [];
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (board[i][j].includes('️⃣')) {
          moves.push(parseInt(board[i][j].charAt(0)));
        }
      }
    }
    return moves;
  }

  makeMove(board, move, player) {
    const symbol = player === 'X' ? '❌' : '⭕';
    const position = move - 1;
    const row = Math.floor(position / 3);
    const col = position % 3;
    
    if (board[row][col].includes('️⃣')) {
      board[row][col] = symbol;
      return true;
    }
    return false;
  }

  getBotMove(board) {
    const availableMoves = this.getAvailableMoves(board);
    
    for (let move of availableMoves) {
      const testBoard = board.map(row => [...row]);
      this.makeMove(testBoard, move, 'O');
      if (this.checkWinner(testBoard, 'O')) {
        return move;
      }
    }
    
    for (let move of availableMoves) {
      const testBoard = board.map(row => [...row]);
      this.makeMove(testBoard, move, 'X');
      if (this.checkWinner(testBoard, 'X')) {
        return move;
      }
    }
    
    if (availableMoves.includes(5)) {
      return 5;
    }
    
    const corners = [1, 3, 7, 9].filter(m => availableMoves.includes(m));
    if (corners.length > 0) {
      return corners[Math.floor(Math.random() * corners.length)];
    }
    
    return availableMoves[Math.floor(Math.random() * availableMoves.length)];
  }

  async execute({ api, event, args, Users }) {
    const gameKey = `${event.threadID}_${event.senderID}`;
    const userID = event.senderID;

    try {
      // ✅ التحقق من وجود لعبة جارية
      if (global.tictactoeGames.has(gameKey)) {
        return api.sendMessage("⚠️ | لديك لعبة جارية بالفعل! رد برقم للعب أو اكتب 'إيقاف'", event.threadID);
      }

      let opponentUID = null;
      let isMultiplayer = false;

      // التحقق من @mention
      const mentions = event.mentions || {};
      const mentionedID = Object.keys(mentions)[0];

      if (mentionedID) {
        // لعبة مع شخص مباشرة
        opponentUID = mentionedID;
        isMultiplayer = true;
      } else if (event.messageReply && event.messageReply.senderID && event.messageReply.senderID !== userID) {
        // الرد على رسالة شخص آخر
        opponentUID = event.messageReply.senderID;
        isMultiplayer = true;
      } else {
        // خيارات اللعب
        let optionsMsg = "🎮 اختر وضع اللعب:\n";
        optionsMsg += "━━━━━━━━━━━━━━━━\n";
        optionsMsg += "📝 رد برقم:\n";
        optionsMsg += "1️⃣ - لعب مع البوت 🤖\n";
        optionsMsg += "2️⃣ - لعب مع شخص (سأطلب منك تاغ الشخص)\n";
        optionsMsg += "━━━━━━━━━━━━━━━━";

        api.sendMessage(optionsMsg, event.threadID, (err, info) => {
          if (!err && info) {
            global.client.handler.reply.set(info.messageID, {
              name: this.name,
              commandType: "selectMode",
              author: userID
            });
          }
        });
        return;
      }

      // ✅ بدء اللعبة
      this.startGame(api, event, userID, opponentUID, isMultiplayer);

    } catch (err) {
      console.error('❌ TicTacToe Error:', err);
      api.sendMessage("❌ | حدث خطأ في اللعبة: " + (err.message || "خطأ غير معروف"), event.threadID);
    }
  }

  async startGame(api, event, userID, opponentUID, isMultiplayer) {
    const gameKey = `${event.threadID}_${userID}`;

    try {
      const board = this.createBoard();
      
      const playerInfo = await api.getUserInfo(userID);
      const playerName = playerInfo?.[userID]?.name || 'اللاعب';
      
      let opponentName = 'البوت 🤖';
      if (isMultiplayer) {
        const opponentInfo = await api.getUserInfo(opponentUID);
        opponentName = opponentInfo?.[opponentUID]?.name || 'اللاعب 2';
      }
      
      const gameData = {
        board: board,
        currentPlayer: 'X',
        playerUID: userID,
        isMultiplayer: isMultiplayer,
        opponentUID: opponentUID || null,
        playerName: playerName,
        opponentName: opponentName,
        threadID: event.threadID
      };

      global.tictactoeGames.set(gameKey, gameData);

      let startMsg = `🎮 لعبة اكس او بدأت!\n`;
      startMsg += `❌ ${gameData.playerName}\n`;
      startMsg += `⭕ ${gameData.opponentName}\n`;
      startMsg += `━━━━━━━━━━━\n\n`;
      startMsg += this.displayBoard(board);
      startMsg += `\n\n${gameData.playerName} دورك! رد برقم (1-9) 🎯`;

      api.sendMessage(startMsg, event.threadID, (err, info) => {
        if (!err && info) {
          global.client.handler.reply.set(info.messageID, {
            name: this.name,
            commandType: "game",
            author: this.author,
            gameKey: gameKey
          });
        }
      });

    } catch (err) {
      console.error('❌ خطأ في بدء اللعبة:', err);
      api.sendMessage("❌ | فشل في بدء اللعبة", event.threadID);
    }
  }

  async onReply({ api, event, reply, Users }) {
    const userID = event.senderID;
    const threadID = event.threadID;
    
    try {
      const bodyText = event.body?.trim();

      // ✅ معالجة اختيار وضع اللعب
      if (reply?.commandType === "selectMode") {
        if (userID !== reply.author) {
          return api.sendMessage("🚫 | هذا الخيار مخصص لصاحب الطلب فقط!", threadID);
        }

        if (bodyText === "1") {
          // لعب مع البوت
          this.startGame(api, event, userID, null, false);
          return;
        } else if (bodyText === "2") {
          // طلب تاغ الشخص
          let msg = "👤 | اكتب اسم أو أيدي الشخص الذي تريد اللعب معه:";
          api.sendMessage(msg, threadID, (err, info) => {
            if (!err && info) {
              global.client.handler.reply.set(info.messageID, {
                name: this.name,
                commandType: "selectPlayer",
                author: userID
              });
            }
          });
          return;
        } else {
          return api.sendMessage("❌ | اختر 1 أو 2 فقط", threadID);
        }
      }

      // ✅ معالجة اختيار اللاعب
      if (reply?.commandType === "selectPlayer") {
        if (userID !== reply.author) {
          return api.sendMessage("🚫 | هذا الخيار مخصص لصاحب الطلب فقط!", threadID);
        }

        const mentions = event.mentions || {};
        let opponentUID = Object.keys(mentions)[0];

        if (!opponentUID) {
          // حاول البحث في الأيدي
          if (bodyText.match(/^\d+$/)) {
            opponentUID = bodyText;
          } else {
            return api.sendMessage("❌ | يجب أن تاغ الشخص أو تكتب أيدي صحيح", threadID);
          }
        }

        if (opponentUID === userID) {
          return api.sendMessage("😂 | ما تقدر تلعب مع نفسك! اختر شخص ثاني", threadID);
        }

        this.startGame(api, event, userID, opponentUID, true);
        return;
      }

      // ✅ معالجة اللعبة
      if (reply?.commandType === "game" || reply?.name === "اكس_او") {
        const gameKey = reply?.gameKey || `${threadID}_${userID}`;
        let gameData = global.tictactoeGames.get(gameKey);

        // ابحث عن لعبة للاعب الحالي
        if (!gameData) {
          for (let [key, game] of global.tictactoeGames) {
            if (key.includes(threadID) && (game.playerUID === userID || game.opponentUID === userID)) {
              gameData = game;
              gameKey = key;
              break;
            }
          }
        }

        if (!gameData) {
          return api.sendMessage("❌ | لا توجد لعبة جارية! اكتب 'اكس او' لبدء لعبة جديدة", threadID);
        }

        // ✅ معالجة أمر إيقاف اللعبة
        if (bodyText.toLowerCase() === "إيقاف" || bodyText.toLowerCase() === "stop") {
          if (userID !== gameData.playerUID && userID !== gameData.opponentUID) {
            return api.sendMessage("🚫 | أنت لست في هذه اللعبة!", threadID);
          }
          global.tictactoeGames.delete(gameKey);
          return api.sendMessage("⏹️ | تم إيقاف اللعبة", threadID);
        }

        // ✅ التحقق من أن اللاعب الحالي هو من يرسل الحركة
        if (gameData.currentPlayer === 'X' && userID !== gameData.playerUID) {
          return api.sendMessage(`⚠️ | ليس دورك الآن!\n▶️ دور ${gameData.playerName}`, threadID);
        }

        if (gameData.currentPlayer === 'O' && gameData.isMultiplayer && userID !== gameData.opponentUID) {
          return api.sendMessage(`⚠️ | ليس دورك الآن!\n▶️ دور ${gameData.opponentName}`, threadID);
        }

        // ✅ معالجة الحركة
        const move = parseInt(bodyText);

        if (isNaN(move) || move < 1 || move > 9) {
          return api.sendMessage("❌ | أدخل رقم صحيح من 1 إلى 9", threadID);
        }

        if (!this.makeMove(gameData.board, move, gameData.currentPlayer)) {
          return api.sendMessage("❌ | الخانة مشغولة بالفعل! اختر خانة أخرى", threadID);
        }

        // ✅ التحقق من الفوز
        if (this.checkWinner(gameData.board, gameData.currentPlayer)) {
          let winMsg = `🎉 ${gameData.currentPlayer === 'X' ? gameData.playerName : gameData.opponentName} فاز! 🏆\n\n`;
          winMsg += this.displayBoard(gameData.board);
          api.sendMessage(winMsg, threadID);
          global.tictactoeGames.delete(gameKey);
          return;
        }

        // ✅ التحقق من التعادل
        if (this.isBoardFull(gameData.board)) {
          let tieMsg = `🤝 تعادل! 🤝\n\n`;
          tieMsg += this.displayBoard(gameData.board);
          api.sendMessage(tieMsg, threadID);
          global.tictactoeGames.delete(gameKey);
          return;
        }

        // ✅ تبديل اللاعب
        gameData.currentPlayer = gameData.currentPlayer === 'X' ? 'O' : 'X';

        // ✅ إذا كان اللاعب الآخر هو البوت
        if (!gameData.isMultiplayer && gameData.currentPlayer === 'O') {
          const botMove = this.getBotMove(gameData.board);
          this.makeMove(gameData.board, botMove, 'O');

          // التحقق من فوز البوت
          if (this.checkWinner(gameData.board, 'O')) {
            let botWinMsg = `🤖 البوت فاز! 🏆\n\n`;
            botWinMsg += this.displayBoard(gameData.board);
            api.sendMessage(botWinMsg, threadID);
            global.tictactoeGames.delete(gameKey);
            return;
          }

          // التحقق من التعادل
          if (this.isBoardFull(gameData.board)) {
            let tieMsg = `🤝 تعادل! 🤝\n\n`;
            tieMsg += this.displayBoard(gameData.board);
            api.sendMessage(tieMsg, threadID);
            global.tictactoeGames.delete(gameKey);
            return;
          }

          gameData.currentPlayer = 'X';
        }

        // ✅ إرسال حالة اللعبة
        let msg = `🎮 اللعبة جارية...\n\n`;
        msg += this.displayBoard(gameData.board);
        msg += `\n\n▶️ ${gameData.currentPlayer === 'X' ? gameData.playerName : gameData.opponentName} دورك! 🎯`;

        api.sendMessage(msg, threadID, (err, info) => {
          if (!err && info) {
            global.client.handler.reply.set(info.messageID, {
              name: this.name,
              commandType: "game",
              author: this.author,
              gameKey: gameKey
            });
          }
        });

      }

    } catch (err) {
      console.error('❌ TicTacToe Reply Error:', err);
      api.sendMessage("❌ | حدث خطأ في اللعبة: " + (err.message || "خطأ غير معروف"), threadID);
    }
  }
}

export default new TicTacToe();
