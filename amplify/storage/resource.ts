import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'userMedia',
  access: (allow) => ({
    'protected/*': [
      // ← change from private/{entity_id}/* to this
      allow.authenticated.to(['read', 'write', 'delete']),
    ],
    'protected/{entity_id}/*': [
      // ← add this line so your old paths still work
      allow.entity('identity').to(['read', 'write', 'delete']),
    ],
  }),
});
