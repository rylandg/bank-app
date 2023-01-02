import aws from 'aws-sdk';
import {v4 as uuid} from 'uuid';

import Queue from './queue';
import {Status, TransactionInput} from './models';

aws.config.update({region: 'us-west-2'});

const queueMessages = async function (message: any, queueUrl: any) {
  const q = new Queue(queueUrl);
  q.enqueue(message);
}

const tInput: TransactionInput = {
  referenceID: uuid(),
  sourceAccountID: '19163523-3e4b-4864-8e1e-f6fb17752d57',
  targetAccountID: 'e3aa179e-f3c5-497d-8912-7b424718192c',
  amount: 500,
  errorMessage: '',
  lastStatus: Status.Started,
};

Promise.resolve(queueMessages(tInput
  , 'https://sqs.us-west-2.amazonaws.com/647353120895/money-transfer-events.fifo'));
