import BankDatabase from "./bankDatabase";

const msleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
function randOneToTen() {
  return 1 + Math.floor(Math.random() * 10);
}

const accountsTable = 'bankaccounts';
const transactionsTable = 'banktransactions';
const failThreshold = 0;

export default class Bank {
  private accountsDatabase = new BankDatabase(accountsTable, transactionsTable);

  async withdraw(accountId: string, transactionAmt: number, referenceId: string) {
    if (randOneToTen() < failThreshold) {
      throw new Error('Issue with withdrawl');
    }
    await this.accountsDatabase.idempotentWithdraw(accountId, transactionAmt, referenceId);
  }

  async deposit(accountId: string, transactionAmt: number, referenceId: string) {
    if (randOneToTen() < failThreshold) {
      throw new Error('Issue with deposit');
    }
    await this.accountsDatabase.idempotentDeposit(accountId, transactionAmt, referenceId);
  }

  async refund(accountId: string, transactionAmt: number, referenceId: string) {
    if (randOneToTen() < failThreshold) {
      throw new Error('Issue with refund');
    }
    await this.accountsDatabase.idempotentRefund(accountId, transactionAmt, referenceId);
  }
}
