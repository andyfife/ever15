import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource.js';
import { data } from './data/resource.js';
import { storage } from './storage/resource.js';
import { createDynamoDBTable } from './data/dynamodb-table.js';

const backend = defineBackend({
  auth,
  data,
  storage,
});

// Create DynamoDB table for ElectroDb entities
const dynamoTable = createDynamoDBTable(backend.createStack('DynamoDBStack'));

// Make table name available to the app via environment variables
backend.addOutput({
  custom: {
    DYNAMODB_TABLE: dynamoTable.tableName,
  },
});
