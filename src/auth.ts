import NextAuth, { CredentialsSignin } from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { authConfig } from '@/auth.config';
import type { LocalUser, UserRole } from '@/types/auth';
import usersData from '@/data/users.json';

const users = usersData as LocalUser[];

const AUTHORIZED_DOMAIN = '@mppb.mp.br';

export class UnauthorizedEmailError extends CredentialsSignin {
  code = 'unauthorized-email';
}

function isAuthorizedEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.toLowerCase();
  return (
    normalized.endsWith(AUTHORIZED_DOMAIN) &&
    users.some((u) => u.email.toLowerCase() === normalized)
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Google,
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = credentials.email as string;
        if (!isAuthorizedEmail(email)) throw new UnauthorizedEmailError();

        const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
        if (!user) return null;

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );
        if (!valid) return null;

        return { id: email, name: user.name, email, role: user.role };
      },
    }),
  ],
  callbacks: {
    signIn({ user }) {
      return isAuthorizedEmail(user.email);
    },
    jwt({ token, user }) {
      if (user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const role = (user as any).role as UserRole | undefined;
        if (role) {
          token.role = role;
        } else {
          const local = users.find((u) => u.email?.toLowerCase() === token.email?.toLowerCase());
          token.role = local?.role ?? 'consulta';
        }
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.role = (token.role as UserRole) ?? 'consulta';
      }
      return session;
    },
  },
});
