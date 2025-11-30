class TicTacToe {
  constructor() {
    this.name = "اكس_او";
    this.author = "Yamada KJ & Alastor";
    this.cooldowns = 10;
    this.description = "لعبة اكس او | الاستخدام: اكس او أو اكس او @منشن";
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
    const gameKey = `${event.threadID}`;
    const userID = event.senderID;

    try {
      let opponentUID = null;
      let isMultiplayer = false;

      // 1️⃣ تحقق من الرد على رسالة شخص (الأولوية الأولى)
      if (event.messageReply && event.messageReply.senderID) {
        opponentUID = event.messageReply.senderID;
        isMultiplayer = true;
        console.log(`[TicTacToe] لعب مع شخص: ${opponentUID} (رد على رسالة)`);
      }
      // 2️⃣ تحقق من @mention (الأولوية الثانية)
      else if (event.mentions && Object.keys(event.mentions).length > 0) {
        opponentUID = Object.keys(event.mentions)[0];
        isMultiplayer = true;
        console.log(`[TicTacToe] لعب مع شخص: ${opponentUID} (@mention)`);
      }
      // 3️⃣ وإلا لعب مع البوت
      else {
        console.log(`[TicTacToe] لعب مع البوت`);
      }

      if (global.tictactoeGames.has(gameKey)) {
        return api.sendMessage("⚠️ يوجد لعبة جارية بالفعل! اكتب 'إيقاف' لإيقافها.", event.threadID);
      }

      const board = this.createBoard();

      const playerInfo = await api.getUserInfo(userID);
      const playerName = playerInfo?.[userID]?.name || 'لاعب';

      let opponentName = 'البوت 🤖';
      if (isMultiplayer && opponentUID) {
        try {
          const opponentInfo = await api.getUserInfo(opponentUID);
          opponentName = opponentInfo?.[opponentUID]?.name || 'لاعب 2';
        } catch (err) {
          console.error('خطأ في الحصول على بيانات الخصم:', err);
          opponentName = 'خصم';
        }
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

      let startMsg = `🎮 اكس او!\n`;
      startMsg += `❌ ${gameData.playerName}\n`;
      startMsg += `⭕ ${gameData.opponentName}\n\n`;
      startMsg += this.displayBoard(board);
      startMsg += `\n\n${gameData.playerName} دورك! اكتب رقم (1-9) 🎯`;

      try {
        const sentMessage = await api.sendMessage(startMsg, event.threadID);
        if (sentMessage?.messageID) {
          global.client.handler.reply.set(sentMessage.messageID, {
            name: this.name,
            gameKey: gameKey
          });
          gameData.messageID = sentMessage.messageID;
        }
      } catch (err) {
        console.error('خطأ في إرسال رسالة البدء:', err);
        api.sendMessage("❌ حدث خطأ في بدء اللعبة", event.threadID);
      }

    } catch (err) {
      console.error('TicTacToe Error:', err);
      api.sendMessage("❌ حدث خطأ: " + err.message, event.threadID);
    }
  }

  async onReply({ api, event, reply, Users }) {
    try {
      const gameKey = reply.gameKey || `${event.threadID}`;
      const userID = event.senderID;

      // احصل على بيانات اللعبة من المخزن العام
      let gameData = global.tictactoeGames.get(gameKey);

      if (!gameData) {
        return api.sendMessage("❌ لا توجد لعبة جارية حالياً! ابدأ لعبة جديدة بـ: .اكس او", event.threadID);
      }

      // تحقق من أن اللاعب الحالي هو من يجب أن يلعب
      if (gameData.currentPlayer === 'X' && userID !== gameData.playerUID) {
        return api.sendMessage(`⚠️ ليس دورك الآن! دور ${gameData.playerName}`, event.threadID);
      }

      if (gameData.currentPlayer === 'O' && gameData.isMultiplayer && userID !== gameData.opponentUID) {
        return api.sendMessage(`⚠️ ليس دورك الآن! دور ${gameData.opponentName}`, event.threadID);
      }

      const moveText = event.body?.trim();
      const move = parseInt(moveText);

      if (isNaN(move) || move < 1 || move > 9) {
        return api.sendMessage("❌ أدخل رقم صحيح من 1 إلى 9", event.threadID);
      }

      if (!this.makeMove(gameData.board, move, gameData.currentPlayer)) {
        return api.sendMessage("❌ الخانة مشغولة بالفعل! اختر خانة أخرى", event.threadID);
      }

      if (this.checkWinner(gameData.board, gameData.currentPlayer)) {
        let winMsg = `🎉 ${gameData.currentPlayer === 'X' ? gameData.playerName : gameData.opponentName} فاز!\n\n`;
        winMsg += this.displayBoard(gameData.board);
        api.sendMessage(winMsg, event.threadID);
        global.tictactoeGames.delete(gameKey);
        if (gameData.messageID) {
          global.client.handler.reply.delete(gameData.messageID);
        }
        return;
      }

      if (this.isBoardFull(gameData.board)) {
        let tieMsg = `🤝 تعادل!\n\n`;
        tieMsg += this.displayBoard(gameData.board);
        api.sendMessage(tieMsg, event.threadID);
        global.tictactoeGames.delete(gameKey);
        if (gameData.messageID) {
          global.client.handler.reply.delete(gameData.messageID);
        }
        return;
      }

      gameData.currentPlayer = gameData.currentPlayer === 'X' ? 'O' : 'X';

      if (!gameData.isMultiplayer && gameData.currentPlayer === 'O') {
        const botMove = this.getBotMove(gameData.board);
        this.makeMove(gameData.board, botMove, 'O');

        if (this.checkWinner(gameData.board, 'O')) {
          let botWinMsg = `🤖 البوت فاز!\n\n`;
          botWinMsg += this.displayBoard(gameData.board);
          api.sendMessage(botWinMsg, event.threadID);
          global.tictactoeGames.delete(gameKey);
          if (gameData.messageID) {
            global.client.handler.reply.delete(gameData.messageID);
          }
          return;
        }

        if (this.isBoardFull(gameData.board)) {
          let tieMsg = `🤝 تعادل!\n\n`;
          tieMsg += this.displayBoard(gameData.board);
          api.sendMessage(tieMsg, event.threadID);
          global.tictactoeGames.delete(gameKey);
          if (gameData.messageID) {
            global.client.handler.reply.delete(gameData.messageID);
          }
          return;
        }

        gameData.currentPlayer = 'X';
      }

      let msg = `🎮 اللعبة جارية...\n\n`;
      msg += this.displayBoard(gameData.board);
      msg += `\n\n${gameData.currentPlayer === 'X' ? gameData.playerName : gameData.opponentName} دورك! 🎯`;

      try {
        const sentMessage = await api.sendMessage(msg, event.threadID);
        if (sentMessage?.messageID) {
          global.client.handler.reply.set(sentMessage.messageID, {
            name: this.name,
            gameKey: gameKey
          });
          gameData.messageID = sentMessage.messageID;
        }
      } catch (err) {
        console.error('خطأ في إرسال رسالة اللعبة:', err);
      }

    } catch (err) {
      console.error('TicTacToe Reply Error:', err);
      api.sendMessage("❌ حدث خطأ: " + err.message, event.threadID);
    }
  }
}

export default new TicTacToe();
