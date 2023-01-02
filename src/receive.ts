import aws from 'aws-sdk';
import {v4 as uuid} from 'uuid';

import Queue from './queue';

aws.config.update({region: 'us-west-2'});

const sqs = new aws.SQS({apiVersion: '2012-11-05'});


const receiveMessages = async function (queueUrl: any) {
  const q = new Queue(queueUrl);
  const message = await q.receiveMessage();
  console.log(message);
}

Promise.resolve(receiveMessages('https://sqs.us-west-2.amazonaws.com/647353120895/money-transfer-events.fifo'));
