class TicTacToe {
  constructor() {
    this.name = "اكس_او";
    this.author = "Kaguya Project";
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
      const mentions = event.mentions || {};
      const opponentUID = Object.keys(mentions)[0];
      const isMultiplayer = !!opponentUID;

      if (global.tictactoeGames.has(gameKey)) {
        return api.sendMessage("⚠️ يوجد لعبة جارية بالفعل! اكتب 'إيقاف' لإيقافها.", event.threadID);
      }

      const board = this.createBoard();
      const gameData = {
        board: board,
        currentPlayer: 'X',
        playerUID: userID,
        isMultiplayer: isMultiplayer,
        opponentUID: opponentUID || null,
        playerName: (await Users.getNameUser(userID)).name,
        opponentName: isMultiplayer ? (await Users.getNameUser(opponentUID)).name : 'البوت 🤖'
      };

      global.tictactoeGames.set(gameKey, gameData);

      let startMsg = `🎮 بدأت لعبة اكس او!\n\n`;
      startMsg += `❌ ${gameData.playerName}\n`;
      startMsg += `⭕ ${gameData.opponentName}\n\n`;
      startMsg += this.displayBoard(board);
      startMsg += `\n\n${gameData.playerName} دورك! اكتب الرقم (1-9)`;

      api.sendMessage(startMsg, event.threadID);

    } catch (err) {
      console.error('TicTacToe Error:', err);
      api.sendMessage("❌ حدث خطأ: " + err.message, event.threadID);
    }
  }
}

export default new TicTacToe();
