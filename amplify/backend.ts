import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource.js';
import { data } from './data/resource.js';
import { storage } from './storage/resource.js'; // or .ts

// That's literally all you need
const backend = defineBackend({
  auth,
  data,
  storage,
});

// ═══════════════════════════════════════════════════════════
// DELETE EVERYTHING BELOW THIS LINE (the part that breaks us-west-2)
// ═══════════════════════════════════════════════════════════
// const s3Bucket = backend.storage.resources.bucket;
// const cfnBucket = s3Bucket.node.defaultChild as s3.CfnBucket;
// cfnBucket.accelerateConfiguration = { accelerationStatus: 'Enabled' };
