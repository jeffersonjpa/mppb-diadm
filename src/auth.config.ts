import type { NextAuthConfig } from 'next-auth';

export const authConfig: NextAuthConfig = {
  trustHost: true,
  providers: [],
  pages: { signIn: '/login' },
};
