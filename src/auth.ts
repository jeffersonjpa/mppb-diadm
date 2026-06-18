import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import type { NextAuthConfig } from 'next-auth';
import type { LocalUser, UserRole } from '@/types/auth';
import usersData from '@/data/users.json';

const users = usersData as LocalUser[];

export const authConfig: NextAuthConfig = {
  providers: [
    Google,
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = users.find(
          (u) => u.email === (credentials.email as string)
        );
        if (!user) return null;

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );
        if (!valid) return null;

        return { id: user.email, name: user.name, email: user.email, role: user.role };
      },
    }),
  ],

  callbacks: {
    signIn({ account, profile }) {
      if (account?.provider === 'google') {
        return !!profile?.email?.endsWith('@mppb.mp.br');
      }
      return true;
    },

    jwt({ token, user }) {
      if (user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const role = (user as any).role as UserRole | undefined;
        if (role) {
          token.role = role;
        } else {
          // Usuário Google: buscar role no arquivo local pelo email
          const local = users.find((u) => u.email === token.email);
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

  pages: {
    signIn: '/login',
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
