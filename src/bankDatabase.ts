import {TransactWriteCommand} from "@aws-sdk/lib-dynamodb";
import {ddbDocClient} from "./dynamoDocClient";

import Database from './database';

export default class BankDatabase extends Database {
  constructor(protected tableName: string, private transactTable: string) {
    super(tableName);
  }

  async idempotentDeposit(accountId: string, amount: number, transactId: string) {
    return this.idempotentTransact(accountId, amount, `deposit-${transactId}`);
  }

  async idempotentWithdraw(accountId: string, amount: number, transactId: string) {
    return this.idempotentTransact(accountId, -amount, `withdraw-${transactId}`);
  }

  async idempotentRefund(accountId: string, amount: number, transactId: string) {
    return this.idempotentTransact(accountId, amount, `refund-${transactId}`);
  }

  private async idempotentTransact(accountId: string, amount: number, transactId: string) {
    const idempotencyCheck = {
      Update: {
        TableName: this.transactTable,
        Key: {
          transactid: transactId,
        },
        UpdateExpression: 'SET tracked = :istracked',
        ConditionExpression: 'attribute_not_exists(transactid)',
        ExpressionAttributeValues: {
          ':istracked': true,
        },
      },
    };

    const balanceChange: any = {
      Update: {
        TableName: this.tableName,
        Key: {
          accountid: accountId,
        },
        UpdateExpression: 'ADD balance :changeAmt',
        ConditionExpression: undefined,
        ExpressionAttributeValues: {
          ':changeAmt': amount,
        },
        ReturnValuesOnConditionCheckFailure: 'ALL_OLD',
      },
    };

    if (amount < 0) {
      balanceChange.Update.ExpressionAttributeValues[':absAmt'] = Math.abs(amount);
      balanceChange.Update.ConditionExpression = 'balance >= :absAmt';
    }

    const params = {
      ClientRequestToken: transactId.slice(0, 35),
      TransactItems: [idempotencyCheck, balanceChange],
    };

    try {
      return await ddbDocClient.send(new TransactWriteCommand(params));
    } catch (err: any) {
      if (err.name === 'TransactionCanceledException') {
        if (err?.CancellationReasons.length > 0) {
          const reason = err.CancellationReasons[1];
          if (reason?.Item?.accountid) {
            throw new Error(`Insufficient balance for account: ${reason.Item.accountid.S}`);
          }
        }
      } else if (err.name === 'ConditionalCheckFailedException') {
        throw new Error('Conditional check failed');
      }
      throw err;
    }

  }
}
