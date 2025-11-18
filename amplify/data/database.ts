import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { RemovalPolicy, Stack, Duration, CfnOutput } from 'aws-cdk-lib';

export function addDatabase(stack: Stack) {

  // Create VPC for RDS
  const vpc = new ec2.Vpc(stack, 'EverVPC', {
    maxAzs: 2,
    natGateways: 1,
    subnetConfiguration: [
      {
        cidrMask: 24,
        name: 'public',
        subnetType: ec2.SubnetType.PUBLIC,
      },
      {
        cidrMask: 24,
        name: 'private',
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      {
        cidrMask: 28,
        name: 'isolated',
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
    ],
  });

  // Create database credentials secret
  const databaseCredentials = new secretsmanager.Secret(stack, 'DBCredentials', {
    secretName: `ever15-db-credentials-${stack.stackName}`,
    generateSecretString: {
      secretStringTemplate: JSON.stringify({ username: 'postgres' }),
      generateStringKey: 'password',
      excludePunctuation: true,
      includeSpace: false,
      passwordLength: 32,
    },
  });

  // Create security group for RDS
  const dbSecurityGroup = new ec2.SecurityGroup(stack, 'DatabaseSecurityGroup', {
    vpc,
    description: 'Security group for Ever15 RDS instance',
    allowAllOutbound: true,
  });

  // Allow PostgreSQL access from within VPC
  dbSecurityGroup.addIngressRule(
    ec2.Peer.ipv4(vpc.vpcCidrBlock),
    ec2.Port.tcp(5432),
    'Allow PostgreSQL access from within VPC'
  );

  // Create RDS PostgreSQL instance
  const database = new rds.DatabaseInstance(stack, 'EverDatabase', {
    engine: rds.DatabaseInstanceEngine.postgres({
      version: rds.PostgresEngineVersion.VER_16,
    }),
    instanceType: ec2.InstanceType.of(
      ec2.InstanceClass.T3,
      ec2.InstanceSize.MICRO
    ),
    vpc,
    vpcSubnets: {
      subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
    },
    securityGroups: [dbSecurityGroup],
    credentials: rds.Credentials.fromSecret(databaseCredentials),
    databaseName: 'ever15',
    allocatedStorage: 20,
    maxAllocatedStorage: 100,
    storageType: rds.StorageType.GP3,
    publiclyAccessible: false,
    multiAz: false,
    deletionProtection: false, // Set to true in production
    removalPolicy: RemovalPolicy.SNAPSHOT, // Create snapshot on deletion
    backupRetention: Duration.days(7),
    preferredBackupWindow: '03:00-04:00',
    preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
  });

  // Output the database endpoint and secret ARN
  new CfnOutput(stack, 'DatabaseEndpoint', {
    value: database.dbInstanceEndpointAddress,
    description: 'RDS database endpoint',
  });

  new CfnOutput(stack, 'DatabasePort', {
    value: database.dbInstanceEndpointPort,
    description: 'RDS database port',
  });

  new CfnOutput(stack, 'DatabaseName', {
    value: 'ever15',
    description: 'Database name',
  });

  new CfnOutput(stack, 'DatabaseSecretArn', {
    value: databaseCredentials.secretArn,
    description: 'ARN of the secret containing database credentials',
  });

  new CfnOutput(stack, 'VpcId', {
    value: vpc.vpcId,
    description: 'VPC ID',
  });

  return { database, vpc, databaseCredentials, dbSecurityGroup };
}
