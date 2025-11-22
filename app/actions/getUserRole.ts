// app/actions/getUserRole.ts
'use server';

import { getCurrentUser } from '@/lib/auth-server';
import { User } from '@/lib/db';
import { redirect } from 'next/navigation';

export async function getUserRole() {
  const currentUser = await getCurrentUser();
  if (!currentUser?.id) return redirect('/');

  const userResp = await User.get({ cognitoSub: currentUser.id }).go();

  return userResp?.data?.role ?? null;
}
