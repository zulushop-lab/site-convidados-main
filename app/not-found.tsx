'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <h2 className="font-headline text-4xl italic text-on-surface mb-4">Página não encontrada</h2>
      <p className="font-body text-on-surface-variant mb-8">Desculpe, não conseguimos encontrar a página que você está procurando.</p>
      <Link href="/" className="btn-primary px-8 py-4">
        Voltar para o Início
      </Link>
    </div>
  );
}

