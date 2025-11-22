import { defineFunction } from '@aws-amplify/backend';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { RemovalPolicy } from 'aws-cdk-lib';

export function createDynamoDBTable(stack: any) {
  const table = new dynamodb.Table(stack, 'Ever15Table', {
    tableName: 'ever15-prod',
    partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
    sortKey: { name: 'sk', type: dynamodb.AttributeType.STRING },
    billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    removalPolicy: RemovalPolicy.RETAIN, // Keep data if stack is deleted
    pointInTimeRecovery: true, // Enable backups
  });

  // GSI1 - Used by: User.byEmail, Media.byMediaId, Friendship.byFriend, etc.
  table.addGlobalSecondaryIndex({
    indexName: 'gsi1pk-gsi1sk-index',
    partitionKey: { name: 'gsi1pk', type: dynamodb.AttributeType.STRING },
    sortKey: { name: 'gsi1sk', type: dynamodb.AttributeType.STRING },
  });

  // GSI2 - Used by: Friendship.byStatus, Task.byType
  table.addGlobalSecondaryIndex({
    indexName: 'gsi2pk-gsi2sk-index',
    partitionKey: { name: 'gsi2pk', type: dynamodb.AttributeType.STRING },
    sortKey: { name: 'gsi2sk', type: dynamodb.AttributeType.STRING },
  });

  return table;
}
