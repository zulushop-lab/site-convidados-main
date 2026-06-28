'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, LockKeyhole, LogIn, ShieldAlert } from 'lucide-react';
import { isAllowedAdminEmail } from '@/lib/adminAccess';
import { useAuth } from '@/lib/context/AuthContext';
import { signInWithGoogle, signOutFromFirebase } from '@/lib/firebase';

function getLoginErrorMessage(error: unknown): string {
  const code = typeof error === 'object' && error !== null && 'code' in error
    ? String((error as { code?: unknown }).code)
    : '';

  if (code === 'auth/unauthorized-domain') {
    return 'O Firebase ainda nao autorizou localhost para login Google. Adicione localhost em Firebase Authentication > Settings > Authorized domains.';
  }

  if (code === 'auth/popup-closed-by-user') {
    return 'Login cancelado antes de concluir.';
  }

  return 'Nao foi possivel entrar com Google. Tente novamente.';
}

export default function AdminLoginPage() {
  const router = useRouter();
  const { user, isLoading, isAdmin } = useAuth();
  const [error, setError] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    if (!isLoading && isAdmin) {
      router.replace('/admin');
    }
  }, [isAdmin, isLoading, router]);

  const handleLogin = async () => {
    setError('');
    setIsSigningIn(true);

    try {
      const nextUser = await signInWithGoogle();
      if (!nextUser.emailVerified || !isAllowedAdminEmail(nextUser.email)) {
        await signOutFromFirebase();
        setError('Este Google nao esta autorizado para o painel dos noivos.');
        return;
      }

      router.replace('/admin');
    } catch (err) {
      setError(getLoginErrorMessage(err));
    } finally {
      setIsSigningIn(false);
    }
  };

  const isSignedNonAdmin = !!user && !user.isAnonymous && !isAdmin;

  return (
    <main className="relative min-h-screen px-6 py-28 md:px-12 lg:px-24">
      <div className="mx-auto flex w-full max-w-xl flex-col">
        <Link
          href="/"
          className="mb-12 inline-flex w-fit items-center gap-2 rounded-sm px-1 font-label text-xs uppercase tracking-widest text-secondary transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Voltar
        </Link>

        <section className="border border-outline-variant/15 bg-surface-lowest p-8 md:p-12">
          <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-sm bg-surface-container text-primary">
            <LockKeyhole className="h-5 w-5" aria-hidden="true" />
          </div>

          <p className="mb-4 font-label text-[10px] uppercase tracking-[0.28em] text-secondary">
            Painel dos noivos
          </p>
          <h1 className="font-headline text-4xl italic leading-tight text-on-surface md:text-5xl">
            Acesso restrito
          </h1>
          <p className="mt-5 max-w-md font-body text-sm leading-relaxed text-on-surface-variant">
            Entre com o Google autorizado para consultar confirmacoes e pagamentos.
          </p>

          <button
            type="button"
            onClick={handleLogin}
            disabled={isLoading || isSigningIn}
            className="mt-10 inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-sm bg-primary px-6 py-4 font-label text-xs uppercase tracking-[0.16em] text-on-primary transition-colors hover:bg-primary-dim disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {isSigningIn ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <LogIn className="h-4 w-4" aria-hidden="true" />
            )}
            Entrar com Google
          </button>

          {(error || isSignedNonAdmin) && (
            <div className="mt-8 flex items-start gap-3 border border-outline-variant/20 bg-surface-container-low p-4 text-sm text-on-surface-variant">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <p>{error || 'A conta atual nao esta autorizada para este painel.'}</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
