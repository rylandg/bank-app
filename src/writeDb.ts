import Database from './database';

const uid = '7c39d800-24f1-4232-b2ee-1f57bc6240b8';
const transactionDB = new Database('transactions');

Promise.resolve(transactionDB.get(uid)).then((item) => console.log(item));
// Promise.resolve(transactionDB.compareAndUpsert(uid, Status.Started));
