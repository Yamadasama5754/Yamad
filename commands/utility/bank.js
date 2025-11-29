import fs from 'fs';
import path from 'path';
import moment from 'moment-timezone';

const bankFilePath = path.join(process.cwd(), 'bank.json');
const DEVELOPER_ID = "100092990751389";

// تأكد من وجود ملف البنك
if (!fs.existsSync(bankFilePath)) {
  fs.writeFileSync(bankFilePath, JSON.stringify({}));
}

const interestRate = 0.05; // 5% فائدة يومية
const loanInterest = 0.10; // 10% فائدة على القروض

function getBankData() {
  return JSON.parse(fs.readFileSync(bankFilePath, 'utf8'));
}

function saveBankData(data) {
  fs.writeFileSync(bankFilePath, JSON.stringify(data, null, 2));
}

function formatBalance(userID, balance) {
  if (userID === DEVELOPER_ID) {
    return `∞${balance}`;
  }
  return balance;
}

export default {
  name: "بنك",
  author: "Kaguya Project",
  role: 0,
  description: "نظام البنك المتكامل - إدارة أموالك بذكاء",

  async execute({ event, args, api, Economy }) {
    const userID = event.senderID;
    const command = args[0];
    const amount = parseInt(args[1], 10);
    
    try {
      const userInfo = await api.getUserInfo(userID);
      const userName = userInfo[userID]?.name || "Unknown";

      const bankData = getBankData();

      // تسجيل المستخدم إذا لم يكن مسجلاً
      if (!bankData[userID]) {
        bankData[userID] = {
          balance: 100,
          lastInterestClaimed: moment().unix(),
          transactions: [],
          loans: [],
          level: 1
        };
        saveBankData(bankData);
        return api.sendMessage(
          `🏦 أهلاً ${userName}!\nتم تسجيلك في بنك كاجويا برصيد ابتدائي 100 دولار\nاكتب: .بنك قائمة\nلترى جميع الأوامر المتاحة 💰`,
          event.threadID
        );
      }

      const userData = bankData[userID];

      switch (command) {
        case "رصيدي":
        case "الرصيد":
          api.setMessageReaction("💰", event.messageID, (err) => {}, true);
          return api.sendMessage(
            `💳 رصيدك البنكي: **${formatBalance(userID, userData.balance)}** دولار`,
            event.threadID
          );

        case "إيداع":
          if (isNaN(amount) || amount <= 0) {
            return api.sendMessage("⚠️ | الرجاء إدخال المبلغ الصحيح", event.threadID);
          }
          const wallet = (await Economy.getBalance(userID)).data;
          if (wallet < amount) {
            return api.sendMessage("⚠️ | ليس لديك هذا المبلغ في محفظتك", event.threadID);
          }
          await Economy.decrease(amount, userID);
          userData.balance += amount;
          userData.transactions.push({
            type: "deposit",
            amount: amount,
            timestamp: moment().unix(),
            description: "إيداع أموال"
          });
          saveBankData(bankData);
          api.setMessageReaction("✅", event.messageID, (err) => {}, true);
          return api.sendMessage(`✅ | تم إيداع **${amount}** دولار\nرصيدك الجديد: **${formatBalance(userID, userData.balance)}**`, event.threadID);

        case "سحب":
          if (isNaN(amount) || amount <= 0) {
            return api.sendMessage("⚠️ | الرجاء إدخال المبلغ الصحيح", event.threadID);
          }
          if (userData.balance < amount) {
            return api.sendMessage("⚠️ | ليس لديك هذا المبلغ في حسابك البنكي", event.threadID);
          }
          await Economy.increase(amount, userID);
          userData.balance -= amount;
          userData.transactions.push({
            type: "withdraw",
            amount: amount,
            timestamp: moment().unix(),
            description: "سحب أموال"
          });
          saveBankData(bankData);
          api.setMessageReaction("✅", event.messageID, (err) => {}, true);
          return api.sendMessage(`✅ | تم سحب **${amount}** دولار\nرصيدك الجديد: **${formatBalance(userID, userData.balance)}**`, event.threadID);

        case "فائدة":
        case "الفائدة":
          const lastClaim = userData.lastInterestClaimed || moment().unix();
          const hoursPassed = (moment().unix() - lastClaim) / 3600;
          
          if (hoursPassed < 24) {
            const hoursRemaining = Math.ceil(24 - hoursPassed);
            return api.sendMessage(
              `⏱️ | يمكنك المطالبة بالفائدة بعد ${hoursRemaining} ساعة`,
              event.threadID
            );
          }

          const interestAmount = Math.floor(userData.balance * interestRate);
          userData.balance += interestAmount;
          userData.lastInterestClaimed = moment().unix();
          userData.transactions.push({
            type: "interest",
            amount: interestAmount,
            timestamp: moment().unix(),
            description: "فائدة يومية 5%"
          });
          saveBankData(bankData);
          api.setMessageReaction("💎", event.messageID, (err) => {}, true);
          return api.sendMessage(
            `💎 | تم إضافة **${interestAmount}** دولار كفائدة!\nرصيدك الجديد: **${formatBalance(userID, userData.balance)}**`,
            event.threadID
          );

        case "قرض":
          if (isNaN(amount) || amount <= 0) {
            return api.sendMessage("⚠️ | الرجاء إدخال مبلغ القرض", event.threadID);
          }
          if (amount > userData.balance * 5) {
            return api.sendMessage("⚠️ | لا يمكنك الحصول على قرض أكثر من 5 أضعاف رصيدك", event.threadID);
          }

          const loanAmount = amount;
          const repayAmount = Math.floor(loanAmount * (1 + loanInterest));
          
          userData.balance += loanAmount;
          userData.loans.push({
            amount: loanAmount,
            repayAmount: repayAmount,
            timestamp: moment().unix(),
            dueDate: moment().add(7, 'days').unix(),
            status: "active"
          });
          userData.transactions.push({
            type: "loan",
            amount: loanAmount,
            timestamp: moment().unix(),
            description: `قرض (يجب سداد ${repayAmount})`
          });
          saveBankData(bankData);
          api.setMessageReaction("🏦", event.messageID, (err) => {}, true);
          return api.sendMessage(
            `🏦 | تم الموافقة على قرضك!\n💰 المبلغ: **${loanAmount}** دولار\n💳 يجب عليك سداد: **${repayAmount}** دولار\n⏰ الموعد: 7 أيام\nرصيدك الجديد: **${formatBalance(userID, userData.balance)}**`,
            event.threadID
          );

        case "سداد":
          const activeLoans = userData.loans.filter(l => l.status === "active");
          if (activeLoans.length === 0) {
            return api.sendMessage("ℹ️ | ليس لديك قروض نشطة", event.threadID);
          }
          const loan = activeLoans[0];
          if (userData.balance < loan.repayAmount) {
            return api.sendMessage(
              `⚠️ | تحتاج إلى **${loan.repayAmount}** دولار للسداد\nرصيدك الحالي: **${userData.balance}** دولار`,
              event.threadID
            );
          }

          userData.balance -= loan.repayAmount;
          loan.status = "paid";
          userData.transactions.push({
            type: "loan_repay",
            amount: loan.repayAmount,
            timestamp: moment().unix(),
            description: "سداد قرض"
          });
          saveBankData(bankData);
          api.setMessageReaction("✅", event.messageID, (err) => {}, true);
          return api.sendMessage(
            `✅ | تم سداد القرض بنجاح!\n💰 المبلغ المدفوع: **${loan.repayAmount}** دولار\nرصيدك الجديد: **${formatBalance(userID, userData.balance)}**`,
            event.threadID
          );

        case "حركة":
        case "المحفظة":
          const recentTransactions = userData.transactions.slice(-5).reverse();
          let transactionList = "📜 آخر 5 عمليات:\n\n";
          
          recentTransactions.forEach((t, i) => {
            const date = moment.unix(t.timestamp).format('DD/MM HH:mm');
            transactionList += `${i + 1}. ${t.description}\n   المبلغ: ${t.amount}د | ${date}\n`;
          });

          api.setMessageReaction("📊", event.messageID, (err) => {}, true);
          return api.sendMessage(transactionList || "ℹ️ | لا توجد عمليات سابقة", event.threadID);

        case "إحصائيات":
        case "احصائيات":
          const totalDeposits = userData.transactions
            .filter(t => t.type === "deposit")
            .reduce((sum, t) => sum + t.amount, 0);
          const totalWithdraws = userData.transactions
            .filter(t => t.type === "withdraw")
            .reduce((sum, t) => sum + t.amount, 0);
          const totalInterest = userData.transactions
            .filter(t => t.type === "interest")
            .reduce((sum, t) => sum + t.amount, 0);

          let stats = `📊 إحصائيات حسابك:\n\n`;
          stats += `💰 الرصيد الحالي: **${formatBalance(userID, userData.balance)}** دولار\n`;
          stats += `📈 المستوى: **${userData.level}** ⭐\n`;
          stats += `💳 إجمالي الإيداعات: **${totalDeposits}** دولار\n`;
          stats += `💸 إجمالي السحوبات: **${totalWithdraws}** دولار\n`;
          stats += `💎 إجمالي الفائدة: **${totalInterest}** دولار\n`;
          stats += `📝 عدد العمليات: **${userData.transactions.length}**`;

          api.setMessageReaction("📊", event.messageID, (err) => {}, true);
          return api.sendMessage(stats, event.threadID);

        case "قائمة":
        case "مساعدة":
          const menu = `🏦 قائمة أوامر البنك:\n
━━━━━━━━━━━━━━━━━━━━
📌 الأساسية:
.بنك رصيدي - عرض رصيدك
.بنك إيداع [المبلغ] - إيداع أموال
.بنك سحب [المبلغ] - سحب أموال

💎 الفائدة:
.بنك فائدة - الحصول على فائدة يومية (5%)

💳 القروض:
.بنك قرض [المبلغ] - الحصول على قرض
.بنك سداد - سداد القرض النشط

📊 التقارير:
.بنك حركة - آخر العمليات
.بنك إحصائيات - إحصائيات حسابك

━━━━━━━━━━━━━━━━━━━━`;

          api.setMessageReaction("ℹ️", event.messageID, (err) => {}, true);
          return api.sendMessage(menu, event.threadID);

        default:
          const defaultMenu = `🏦 **بنك كاجويا** - نظام البنك المتكامل\n
👤 أهلاً ${userName}!\nرصيدك: **${userData.balance}** دولار

اكتب: .بنك قائمة
لترى جميع الأوامر المتاحة 💰`;

          api.setMessageReaction("🏦", event.messageID, (err) => {}, true);
          return api.sendMessage(defaultMenu, event.threadID);
      }
    } catch (error) {
      console.error("[BANK] Error:", error.message);
      api.setMessageReaction("❌", event.messageID, (err) => {}, true);
      return api.sendMessage("❌ | حدث خطأ، يرجى المحاولة لاحقاً", event.threadID);
    }
  }
};
