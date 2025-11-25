export default {
  name: "tictactoe",
  execute: async ({ api, event }) => {
    if (!global.tictactoeGames || global.tictactoeGames.size === 0) return;

    const gameKey = `${event.threadID}`;
    const game = global.tictactoeGames.get(gameKey);

    if (!game) return;

    const input = (event.body || '').trim();
    const move = parseInt(input);

    if (input.toLowerCase() === 'إيقاف' || input.toLowerCase() === 'stop') {
      global.tictactoeGames.delete(gameKey);
      return api.sendMessage("⏹️ تم إيقاف اللعبة.", event.threadID);
    }

    // تقبل الأرقام فقط (1-9)
    if (isNaN(move) || move < 1 || move > 9) {
      // فقط رسالة خفيفة للأرقام غير الصحيحة
      if (!isNaN(move)) {
        return api.sendMessage("❌ الرقم يجب أن يكون بين 1 و 9", event.threadID);
      }
      return;
    }

    try {
      const tictactoe = (await import("../commands/utility/tictactoe.js")).default;

      if (game.isMultiplayer) {
        if (game.currentPlayer === 'X' && event.senderID !== game.playerUID) {
          return;
        }
        if (game.currentPlayer === 'O' && event.senderID !== game.opponentUID) {
          return;
        }
      } else {
        if (event.senderID !== game.playerUID) {
          return;
        }
      }

      if (!tictactoe.makeMove(game.board, move, game.currentPlayer)) {
        return api.sendMessage("❌ هذا المربع مشغول! اختر مربع آخر.", event.threadID);
      }

      if (tictactoe.checkWinner(game.board, game.currentPlayer)) {
        const winner = game.currentPlayer === 'X' ? game.playerName : game.opponentName;
        let msg = `🎊 انتهت!\n`;
        msg += tictactoe.displayBoard(game.board);
        msg += `\n🏆 الفائز: ${winner}`;
        api.sendMessage(msg, event.threadID);
        global.tictactoeGames.delete(gameKey);
        return;
      }

      if (tictactoe.isBoardFull(game.board)) {
        let msg = `🤝 تعادل!\n`;
        msg += tictactoe.displayBoard(game.board);
        api.sendMessage(msg, event.threadID);
        global.tictactoeGames.delete(gameKey);
        return;
      }

      if (game.isMultiplayer) {
        game.currentPlayer = game.currentPlayer === 'X' ? 'O' : 'X';
        const nextPlayer = game.currentPlayer === 'X' ? game.playerName : game.opponentName;
        let msg = tictactoe.displayBoard(game.board);
        msg += `\n\n${nextPlayer} دورك! 🎯`;
        api.sendMessage(msg, event.threadID);
      } else {
        game.currentPlayer = 'O';
        const botMove = tictactoe.getBotMove(game.board);
        tictactoe.makeMove(game.board, botMove, 'O');

        if (tictactoe.checkWinner(game.board, 'O')) {
          let msg = `🤖 البوت يفوز!\n`;
          msg += tictactoe.displayBoard(game.board);
          msg += `\n🏆 الفائز: البوت 🤖`;
          api.sendMessage(msg, event.threadID);
          global.tictactoeGames.delete(gameKey);
          return;
        }

        if (tictactoe.isBoardFull(game.board)) {
          let msg = `🤝 تعادل!\n`;
          msg += tictactoe.displayBoard(game.board);
          api.sendMessage(msg, event.threadID);
          global.tictactoeGames.delete(gameKey);
          return;
        }

        game.currentPlayer = 'X';
        let msg = tictactoe.displayBoard(game.board);
        msg += `\n\n${game.playerName} دورك! 🎯`;
        api.sendMessage(msg, event.threadID);
      }

    } catch (err) {
      console.error('Move Error:', err);
    }
  }
};
