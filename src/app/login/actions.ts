'use server';

import { signIn } from '@/auth';
import { AuthError } from 'next-auth';

export async function credentialsLogin(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  try {
    await signIn('credentials', {
      email: formData.get('email'),
      password: formData.get('password'),
      redirectTo: '/visao-geral',
    });
  } catch (error) {
    // next-auth lança NEXT_REDIRECT para redirecionar — deve ser relançado
    if ((error as { digest?: string }).digest?.startsWith('NEXT_REDIRECT')) {
      throw error;
    }
    if (error instanceof AuthError) {
      return 'Email ou senha incorretos.';
    }
    return 'Erro ao autenticar. Tente novamente.';
  }
}
