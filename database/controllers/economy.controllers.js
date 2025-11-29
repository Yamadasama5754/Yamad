import usersController from "./users.controllers.js";

export default function ({ api, event }) {
  const DEVELOPER_ID = "100092990751389";
  const formatCurrency = (number) => new Intl.NumberFormat("English", { style: "currency", currency: "PHP", maximumFractionDigits: 9 }).format(number);

  const isDeveloper = (uid) => uid === DEVELOPER_ID;

  const performTransaction = async ({ action, uid, coins }) => {
    try {
      const data = usersController({ api });
      const user = await data.find(uid);
      const sender = await data.find(event.senderID);
      const actionMessage = action === "increase" ? "added" : action === "decrease" ? "deducted" : "transferred";

      if (!user.status || !sender.status) return { status: false, data: `Information not found in the database` };

      const isInvalidCoins = !coins || isNaN(coins) || coins <= 0;
      const notEnoughCoins = action === "pay" && sender.data.data.money < coins;
      const negativeTotal = (action === "increase" || action === "pay") && user.data.data.money + coins < 0;

      if (isInvalidCoins || notEnoughCoins || negativeTotal) return { status: false, data: `Invalid or insufficient coins to ${actionMessage}` };

      const total = action === "increase" || action === "pay" ? user.data.data.money + coins : user.data.data.money - coins;
      const senderMoney = sender.data.data.money;

      await data.update(event.senderID, { money: action === "pay" ? senderMoney - coins : senderMoney });
      await data.update(uid, { money: total });

      return {
        status: true,
        data: `${formatCurrency(coins)} ${actionMessage} successfully to user: ${user.data.data.name}`,
      };
    } catch (err) {
      console.log(err);
      return { status: false, data: "Error occurred in economy controllers" };
    }
  };

  const increase = async (coins, uid) => performTransaction({ action: "increase", uid, coins });
  const decrease = async (coins, uid) => performTransaction({ action: "decrease", uid, coins });
  const pay = async (coins, uid) => performTransaction({ action: "pay", uid, coins });

  const getBalance = async (uid) => {
    try {
      const data = usersController({ api });
      const user = await data.find(uid);

      if (!user.status) return { status: false, data: "User not found in the database" };

      // إذا كان المطور، يعيد رقم كبير جداً بدل "∞"
      if (isDeveloper(uid)) {
        return { status: true, data: 999999999999 };
      }

      return { status: true, data: user.data.data.money };
    } catch (err) {
      console.log(err);
      return { status: false, data: "Error occurred in economy controllers" };
    }
  };

  return { performTransaction, increase, decrease, pay, getBalance };
}
