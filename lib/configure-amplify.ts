'use client';

import { Amplify } from 'aws-amplify';
import outputs from '@/amplify_outputs.json';

if (typeof window !== 'undefined') {
  Amplify.configure(outputs, {
    ssr: true,
  });
}

export default Amplify;
