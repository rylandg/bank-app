import Database from './database';
import Bank from './bank';
import {Status, TransactionInput} from './models';
import Queue from './queue';

const transactionDB = new Database('transactions');

const receiveMessages = async function (queueUrl: any) {
  const q = new Queue(queueUrl);
  while (true) {
    const message = await q.receiveMessage();
    if (message) {
      try {
        await processTransfer(JSON.parse(message.Body) as TransactionInput);
        await q.deleteMessage(message.ReceiptHandle);
      } catch (err) {
        console.log(err);
      }
    }
  }
}

const bank = new Bank();

const processTransfer = async (inputTransaction: TransactionInput) => {
  const refId = inputTransaction.referenceID;
  const item = await transactionDB.getOrCreate(refId);
  const itemStatus = item.Attributes.tstatus;

  let status = itemStatus;
  while (status !== Status.Succeeded && status !== Status.Failed) {
    if (status === Status.Started) {
      console.log(`Starting to process withdrawl for transaction with id: ${refId}`);
      await bank.withdraw(inputTransaction.sourceAccountID, inputTransaction.amount, refId);
      status = Status.Depositing;
    } else if (status === Status.Depositing) {
      await bank.deposit(inputTransaction.targetAccountID, inputTransaction.amount, refId);
      status = Status.Succeeded;
      console.log(`Succeeded processing deposit for transaction with id: ${refId}`);
    } else if (status === Status.Refunding) {
      await bank.deposit(inputTransaction.sourceAccountID, inputTransaction.amount, refId);
      status = Status.Failed;
    }

    await transactionDB.compareAndUpsert(refId, status);
  }
}

Promise.resolve(receiveMessages('https://sqs.us-west-2.amazonaws.com/647353120895/money-transfer-events.fifo'));
