export type UserRole = 'admin' | 'gestor' | 'analista' | 'consulta';

export interface LocalUser {
  email: string;
  passwordHash: string;
  name: string;
  role: UserRole;
}

declare module 'next-auth' {
  interface Session {
    user: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: UserRole;
    };
  }

  interface JWT {
    role?: UserRole;
  }
}
