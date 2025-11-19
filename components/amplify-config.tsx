// components/amplify-config.tsx  (or wherever it is)
'use client';

import { useEffect } from 'react';
import { Amplify } from 'aws-amplify';
import outputs from '@/amplify_outputs.json';

export function AmplifyConfig() {
  useEffect(() => {
    Amplify.configure(outputs); // ← REMOVE THE { ssr: true } OBJECT
  }, []);

  return null;
}
