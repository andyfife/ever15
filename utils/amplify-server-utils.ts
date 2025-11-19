// utils/amplifyServerContext.ts
// (or utils/amplify-server-utils.ts — name doesn't matter)

import { createServerRunner } from '@aws-amplify/adapter-nextjs';

import amplifyconfiguration from '@/amplify_outputs.json';
// This line creates the runner once and exports the exact function Amplify expects
export const { runWithAmplifyServerContext } = createServerRunner({
  config: amplifyconfiguration,
});
