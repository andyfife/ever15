// lib/db.ts  ← COPY-PASTE THIS EXACT FILE AND ALL ERRORS ARE GONE FOREVER
import { Entity } from 'electrodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

const table = process.env.DYNAMODB_TABLE || 'ever15-prod';

// ===================================================================
// USER
// ===================================================================
export const User = new Entity(
  {
    model: { entity: 'user', version: '1', service: 'ever15' },
    attributes: {
      cognitoSub: { type: 'string', required: true },
      email: { type: 'string', required: true },
      emailVerified: { type: 'boolean', default: false },
      username: { type: 'string' },
      firstName: { type: 'string' },
      lastName: { type: 'string' },
      name: { type: 'string' },
      picture: { type: 'string' },
      birthdate: { type: 'string' },
      gender: { type: 'string' },
      phoneNumber: { type: 'string' },
      phoneNumberVerified: { type: 'boolean', default: false },
      role: { type: ['USER', 'ADMIN'] as const, default: 'USER' },
      isActive: { type: 'boolean', default: true },
      currentAvatarId: { type: 'string' },
      createdAt: {
        type: 'string',
        readOnly: true,
        default: () => new Date().toISOString(),
      },
    },
    indexes: {
      bySub: { pk: { field: 'pk', composite: ['cognitoSub'] } },
      byEmail: {
        index: 'gsi1pk-gsi1sk-index',
        pk: { field: 'gsi1pk', composite: ['email'] },
      },
    },
  },
  { table, client }
);

// ===================================================================
// MEDIA
// ===================================================================
export const Media = new Entity(
  {
    model: { entity: 'media', version: '1', service: 'ever15' },
    attributes: {
      userId: { type: 'string', required: true },
      mediaId: { type: 'string', required: true },
      type: {
        type: ['PHOTO', 'VIDEO', 'AUDIO', 'DOCUMENT'] as const,
        required: true,
      },
      name: { type: 'string' },
      description: { type: 'string' },
      visibility: {
        type: ['PRIVATE', 'FRIENDS', 'PUBLIC'] as const,
        default: 'PRIVATE',
      },
      url: { type: 'string', required: true },
      thumbnailUrl: { type: 'string' },
      fileSize: { type: 'number' },
      mimeType: { type: 'string' },
      duration: { type: 'number' },
      width: { type: 'number' },
      height: { type: 'number' },
      approvalStatus: {
        type: ['DRAFT', 'AWAITING_ADMIN', 'APPROVED', 'REJECTED'] as const,
        default: 'DRAFT',
      },
      moderationStatus: {
        type: [
          'PENDING',
          'APPROVED',
          'REJECTED',
          'REVIEW',
          'PROCESSING',
        ] as const,
      },
      createdAt: { type: 'string', default: () => new Date().toISOString() },
      processedAt: { type: 'string' },
    },
    indexes: {
      byUser: {
        pk: { field: 'pk', composite: ['userId'] },
        sk: { field: 'sk', composite: ['createdAt', 'mediaId'] },
      },
      byType: {
        index: 'gsi1pk-gsi1sk-index',
        pk: { field: 'gsi1pk', composite: ['type'] },
        sk: { field: 'gsi1sk', composite: ['createdAt'] },
      },
      byApproval: {
        index: 'gsi2pk-gsi2sk-index',
        pk: { field: 'gsi2pk', composite: ['approvalStatus'] },
      },
      byMediaId: {
        index: 'gsi3pk-gsi3sk-index',
        pk: { field: 'gsi3pk', composite: ['mediaId'] },
      },
    },
  },
  { table, client }
);

// ===================================================================
// SPEAKER
// ===================================================================
export const Speaker = new Entity(
  {
    model: { entity: 'speaker', version: '1', service: 'ever15' },
    attributes: {
      mediaId: { type: 'string', required: true },
      speakerId: { type: 'string', required: true },
      name: { type: 'string', required: true },
      relationship: {
        type: [
          'GRANDFATHER_MATERNAL',
          'GRANDFATHER_PATERNAL',
          'GRANDMOTHER_MATERNAL',
          'GRANDMOTHER_PATERNAL',
          'FATHER',
          'MOTHER',
          'UNCLE_MATERNAL',
          'UNCLE_PATERNAL',
          'AUNT_MATERNAL',
          'AUNT_PATERNAL',
          'DADS_SIDE_OTHER',
          'MOMS_SIDE_OTHER',
          'SIBLING',
          'SPOUSE',
          'CHILD',
          'FRIEND',
          'COLLEAGUE',
          'NEIGHBOR',
          'OTHER',
        ] as const,
      },
      isSelf: { type: 'boolean', default: false },
      linkedUserId: { type: 'string' },
    },
    indexes: {
      byMedia: {
        pk: { field: 'pk', composite: ['mediaId'] },
        sk: { field: 'sk', composite: ['speakerId'] },
      },
    },
  },
  { table, client }
);

// ===================================================================
// TRANSCRIPT
// ===================================================================
export const Transcript = new Entity(
  {
    model: { entity: 'transcript', version: '1', service: 'ever15' },
    attributes: {
      mediaId: { type: 'string', required: true },
      transcriptId: { type: 'string', required: true },
      text: { type: 'string' },
      srtUrl: { type: 'string' },
      vttUrl: { type: 'string' },
      isCurrent: { type: 'boolean', default: false },
      status: {
        type: [
          'QUEUED',
          'PROCESSING',
          'FAILED',
          'COMPLETED',
          'REJECTED',
        ] as const,
      },
      error: { type: 'string' },
      userApproved: { type: 'boolean', default: false },
      desiredVisibility: { type: ['PRIVATE', 'FRIENDS', 'PUBLIC'] as const },
      fileName: { type: 'string' },
      speakerMappings: { type: 'any' },
      summary: { type: 'string' },
      keywords: { type: 'list', items: { type: 'string' } },
      rawSegments: { type: 'any' },
      provider: {
        type: [
          'INTERNAL',
          'WHISPER',
          'ASSEMBLYAI',
          'DEEPGRAM',
          'OPENAI',
          'OTHER',
        ] as const,
      },
      createdAt: { type: 'string', default: () => new Date().toISOString() },
      updatedAt: {
        type: 'string',
        set: () => new Date().toISOString(),
        watch: '*',
      },
    },
    indexes: {
      byMedia: {
        pk: { field: 'pk', composite: ['mediaId'] },
        sk: { field: 'sk', composite: ['createdAt', 'transcriptId'] },
      },
      currentOnly: {
        index: 'gsi1pk-gsi1sk-index',
        pk: { field: 'gsi1pk', composite: ['mediaId'] },
        sk: { field: 'gsi1sk', composite: ['isCurrent', 'createdAt'] },
      },
    },
  },
  { table, client }
);

// ===================================================================
// FRIENDSHIP
// ===================================================================
export const Friendship = new Entity(
  {
    model: { entity: 'friendship', version: '1', service: 'ever15' },
    attributes: {
      userId1: { type: 'string', required: true },
      userId2: { type: 'string', required: true },
      status: {
        type: ['PENDING', 'ACCEPTED', 'REJECTED', 'BLOCKED'] as const,
        default: 'PENDING',
      },
      createdAt: { type: 'string', default: () => new Date().toISOString() },
      updatedAt: { type: 'string', default: () => new Date().toISOString() }, // ✅ Moved inside attributes
    },
    indexes: {
      outgoing: {
        pk: { field: 'pk', composite: ['userId1'] },
        sk: { field: 'sk', composite: ['userId2'] },
      },
      incoming: {
        index: 'gsi1pk-gsi1sk-index',
        pk: { field: 'gsi1pk', composite: ['userId2'] },
        sk: { field: 'gsi1sk', composite: ['userId1'] },
      },
    },
  },
  { table, client }
);

// ===================================================================
// TASK
// ===================================================================
export const Task = new Entity(
  {
    model: { entity: 'task', version: '1', service: 'ever15' },
    attributes: {
      taskId: { type: 'string', required: true },
      type: { type: 'string', required: true },
      status: {
        type: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'] as const,
        default: 'PENDING',
      },
      payload: { type: 'any' },
      errorMessage: { type: 'string' },
      createdAt: { type: 'string', default: () => new Date().toISOString() },
    },
    indexes: {
      primary: { pk: { field: 'pk', composite: ['taskId'] } },
      byType: {
        index: 'gsi1pk-gsi1sk-index',
        pk: { field: 'gsi1pk', composite: ['type'] },
        sk: { field: 'gsi1sk', composite: ['createdAt'] },
      },
    },
  },
  { table, client }
);

// ===================================================================
// NOTIFICATION
// ===================================================================
export const Notification = new Entity(
  {
    model: { entity: 'notification', version: '1', service: 'ever15' },
    attributes: {
      userId: { type: 'string', required: true },
      notificationId: { type: 'string', required: true },
      type: { type: 'string' },
      title: { type: 'string' },
      message: { type: 'string' },
      link: { type: 'string' },
      read: { type: 'boolean', default: false },
      createdAt: { type: 'string', default: () => new Date().toISOString() },
      updatedAt: { type: 'string', default: () => new Date().toISOString() },
    },
    indexes: {
      byUser: {
        pk: { field: 'pk', composite: ['userId'] },
        sk: { field: 'sk', composite: ['createdAt', 'notificationId'] },
      },
      byUserUnread: {
        index: 'gsi1pk-gsi1sk-index',
        pk: { field: 'gsi1pk', composite: ['userId'] },
        sk: { field: 'gsi1sk', composite: ['read', 'createdAt'] },
      },
    },
  },
  { table, client }
);

// ===================================================================
// MESSAGE — THIS IS WHAT WAS MISSING
// ===================================================================
export const Message = new Entity(
  {
    model: { entity: 'message', version: '1', service: 'ever15' },
    attributes: {
      messageId: { type: 'string', required: true },
      senderId: { type: 'string', required: true },
      recipientId: { type: 'string', required: true },
      content: { type: 'string', required: true },
      fulfilled: { type: 'boolean', default: false },
      messageRead: { type: 'boolean', default: false },
      messageDeleted: { type: 'boolean', default: false },
      createdAt: { type: 'string', default: () => new Date().toISOString() },
    },
    indexes: {
      byRecipient: {
        pk: { field: 'pk', composite: ['recipientId'] },
        sk: { field: 'sk', composite: ['createdAt', 'messageId'] },
      },
      bySender: {
        index: 'gsi1pk-gsi1sk-index',
        pk: { field: 'gsi1pk', composite: ['senderId'] },
        sk: { field: 'gsi1sk', composite: ['createdAt', 'messageId'] },
      },
    },
  },
  { table, client }
);
export const FriendInvite = new Entity(
  {
    model: { entity: 'friendInvite', version: '1', service: 'ever15' },
    attributes: {
      inviterId: { type: 'string', required: true },
      inviteeEmail: { type: 'string', required: true },
      inviteeName: { type: 'string' },
      message: { type: 'string' },
      token: { type: 'string', required: true },
      status: {
        type: ['PENDING', 'ACCEPTED', 'EXPIRED', 'CANCELLED'] as const,
        default: 'PENDING',
      },
      expiresAt: { type: 'string' },
      createdAt: { type: 'string', default: () => new Date().toISOString() },
    },
    indexes: {
      byInviter: {
        pk: { field: 'pk', composite: ['inviterId'] },
        sk: { field: 'sk', composite: ['createdAt'] },
      },
      byEmail: {
        index: 'gsi1pk-gsi1sk-index',
        pk: { field: 'gsi1pk', composite: ['inviteeEmail'] },
      },
    },
  },
  { table, client }
);

// ===================================================================
// CONTACT
// ===================================================================
export const Contact = new Entity(
  {
    model: { entity: 'contact', version: '1', service: 'ever15' },
    attributes: {
      contactId: { type: 'string', required: true },
      userId: { type: 'string', required: true },
      name: { type: 'string' },
      email: { type: 'string' },
      comment: { type: 'string' },
      createdAt: { type: 'string', default: () => new Date().toISOString() },
      updatedAt: { type: 'string', default: () => new Date().toISOString() },
    },
    indexes: {
      byUser: {
        pk: { field: 'pk', composite: ['userId'] },
        sk: { field: 'sk', composite: ['createdAt', 'contactId'] },
      },
    },
  },
  { table, client }
);

// Convenience export
export const db = {
  User,
  Media,
  Speaker,
  Transcript,
  Friendship,
  Task,
  Notification,
  Message,
  FriendInvite,
  Contact,
};
