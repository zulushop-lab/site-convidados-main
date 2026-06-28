import type { Metadata } from 'next';
import { CoupleGallery } from '@/components/CoupleGallery';
import { PageHero } from '@/components/PageHero';
import { coupleGalleryHeroImages, coupleGalleryImages } from '@/lib/gallery';

export const metadata: Metadata = {
  title: 'Galeria dos Noivos | Isadora & Matheus',
  description: 'Galeria do pre-wedding de Isadora e Matheus.',
};

export default function GaleriaPage() {
  return (
    <main className="relative overflow-x-hidden pb-24">
      <PageHero
        title="Galeria dos Noivos"
        subtitle="Pre-wedding"
        images={coupleGalleryHeroImages.length > 0 ? coupleGalleryHeroImages : ['/imagem-1.jpg', '/imagem-2.jpg', '/imagem-3.jpg']}
        imageClassName="object-cover"
        imageAlt="Isadora e Matheus"
        containerClassName="mb-8"
      />

      <section className="mx-auto max-w-5xl px-6 pb-8 text-center md:px-10">
        <p className="mb-4 font-label text-xs uppercase tracking-normal text-secondary">
          {coupleGalleryImages.length > 0 ? `${coupleGalleryImages.length} fotos selecionadas` : 'Ensaio I&M'}
        </p>
        <h1 className="font-headline text-4xl italic leading-tight text-on-surface md:text-6xl">
          Uma pagina para guardar o olhar do nosso comeco.
        </h1>
        <p className="mx-auto mt-6 max-w-3xl font-body text-lg leading-relaxed text-on-surface-variant md:text-xl">
          Reunimos as fotos selecionadas do pre-wedding em versoes WebP leves, mantendo a experiencia fluida no celular.
        </p>
      </section>

      <CoupleGallery items={coupleGalleryImages} />
    </main>
  );
}
