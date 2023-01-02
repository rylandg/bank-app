import aws from 'aws-sdk';
import {v4 as uuid} from 'uuid';

export interface QueueItem {
  MessageId: string,
  ReceiptHandle: string,
  MD5OfBody: string,
  Body: string,
}

export default class Queue {
  private sqs: aws.SQS = new aws.SQS({apiVersion: '2012-11-05'});

  constructor(private queueUrl: string) {
    aws.config.update({region: 'us-west-2'});
  }

  async enqueue(payload: any): Promise<void> {
    try {
      const Id = uuid();
      await this.sqs.sendMessage({
        MessageBody: JSON.stringify(payload),
        MessageDeduplicationId: Id,
        MessageGroupId: Id,
        QueueUrl: this.queueUrl,
      }).promise();
    } catch (e: any) {
      throw new Error(e.message)
    }
  }

  async receiveMessage(): Promise<QueueItem | undefined> {
    const params = {
      MaxNumberOfMessages: 1,
      QueueUrl: this.queueUrl,
      VisibilityTimeout: 20,
      WaitTimeSeconds: 10,
    };

    return new Promise((resolve, reject) => {
      this.sqs.receiveMessage(params, async (err, data) => {
        if (err) {
          return reject(err);
        } else if (data.Messages) {
          const msg = data.Messages[0];
          if (msg.MessageId || msg.ReceiptHandle || msg.MD5OfBody || msg.Body) {
            return resolve(msg as QueueItem);
          }

          return resolve(undefined);
        }

        return resolve(undefined);
      });
    });
  }

  async deleteMessage(receiptHandle: string) {
    const deleteParams = {
      QueueUrl: this.queueUrl,
      ReceiptHandle: receiptHandle,
    };

    return new Promise((resolve, reject) => {
      this.sqs.deleteMessage(deleteParams, (err, data) => {
        if (err) {
          return reject(err);
        }
        return resolve(data);
      });
    });
  }
}
