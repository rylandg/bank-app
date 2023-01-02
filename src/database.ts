import {UpdateCommand, GetCommand} from "@aws-sdk/lib-dynamodb";
import {ddbDocClient} from "./dynamoDocClient";

import {Status} from './models';

export default class Database {
  constructor(protected tableName: string) {}

  async get(itemId: string) {
    const params = {
      TableName: this.tableName,
      Key: {
        tid: itemId,
      },
    };
    try {
      const returnedItem = await ddbDocClient.send(new GetCommand(params));
      return returnedItem.Item;
    } catch (err: any) {
      console.log(err);
    }
  }

  async compareAndUpsert(itemId: string, newStatus: Status) {
    const params = {
      TableName: this.tableName,
      Key: {
        tid: itemId,
      },
      UpdateExpression: 'set tstatus = :newStatus',
      ConditionExpression: 'attribute_not_exists(tstatus) or tstatus < :newStatus',
      ExpressionAttributeValues: {
        ':newStatus': newStatus,
      },
      ReturnValues: 'UPDATED_NEW',
    };
    try {
      return await ddbDocClient.send(new UpdateCommand(params));
    } catch (err: any) {
      if (err.name === 'ConditionalCheckFailedException') {
        throw new Error('Conditional check failed');
      }
      throw err;
    }
  }

  async getOrCreate(itemId: string): Promise<any> {
    const params = {
      TableName: this.tableName,
      Key: {
        tid: itemId,
      },
      UpdateExpression: 'SET tstatus = if_not_exists(tstatus, :newStatus)',
      ExpressionAttributeValues: {
        ':newStatus': 1,
      },
      ReturnValues: 'UPDATED_NEW',
    };
    return await ddbDocClient.send(new UpdateCommand(params));
  }
}
