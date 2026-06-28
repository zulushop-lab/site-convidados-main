'use client';

import Link from 'next/link';
import { Banknote, Calendar, Camera } from 'lucide-react';
import { ImageSlider } from '@/components/ImageSlider';
import { Countdown } from '@/components/Countdown';
import { motion, useScroll, useTransform } from 'motion/react';
import { AnimatedText } from '@/components/AnimatedText';
import { FadeIn } from '@/components/FadeIn';
import { FocusRail } from '@/components/FocusRail';
import { HomeMenuCards } from '@/components/HomeMenuCards';
import { MarqueeGallery } from '@/components/MarqueeGallery';
import { usePathname, useRouter } from 'next/navigation';
import { useRef, useEffect } from 'react';
import { TextScramble } from '@/components/TextScramble';
import { NoiseOverlay } from '@/components/NoiseOverlay';
import { SlideToUnlock } from '@/components/SlideToUnlock';
import { TieLeaderboard } from '@/components/TieLeaderboard';
import { HomeEventHighlights } from '@/components/HomeEventHighlights';
import { coupleGalleryHeroImages, coupleGalleryImages } from '@/lib/gallery';

export default function Home() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLinkClick = (href: string) => {
    if (pathname !== href) {
      window.dispatchEvent(new Event('ais-loading-start'));
    }
  };
  const galleryImage = (index: number, fallback: string) => coupleGalleryImages[index]?.src ?? fallback;
  const heroImages = coupleGalleryHeroImages.length > 0 ? coupleGalleryHeroImages : [
    "/galeria-noivos/enim-126.webp",
    "/galeria-noivos/enim-136.webp",
    "/galeria-noivos/enim-381.webp"
  ];

  const heroRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress: heroScroll } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });

  const yImage = useTransform(heroScroll, [0, 1], ["0%", "15%"]);
  const scaleImage = useTransform(heroScroll, [0, 1], [1, 1.05]);
  const yText = useTransform(heroScroll, [0, 1], ["0%", "-10%"]);
  const opacityText = useTransform(heroScroll, [0, 0.7], [1, 0]);

  // Smooth scroll handler for anchor links
  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      
      if (anchor && anchor.hash && anchor.hash.startsWith('#')) {
        const href = anchor.getAttribute('href');
        if (href && href.startsWith('#')) {
          e.preventDefault();
          const targetId = anchor.hash.substring(1);
          const element = document.getElementById(targetId);
          
          if (element) {
            const offset = 80; // Adjust for header height
            const bodyRect = document.body.getBoundingClientRect().top;
            const elementRect = element.getBoundingClientRect().top;
            const elementPosition = elementRect - bodyRect;
            const offsetPosition = elementPosition - offset;

            window.scrollTo({
              top: offsetPosition,
              behavior: 'smooth'
            });
            
            // Update URL without jump
            window.history.pushState(null, '', anchor.hash);
          }
        }
      }
    };

    document.addEventListener('click', handleAnchorClick);
    return () => document.removeEventListener('click', handleAnchorClick);
  }, []);

  return (
    <main className="relative pb-24 overflow-x-hidden scroll-smooth">
      <NoiseOverlay />
      {/* Hero Section */}
      <section id="hero" ref={heroRef} className="relative h-[90vh] md:h-screen flex flex-col mb-16 overflow-hidden">
        <motion.div 
          style={{ y: yImage, scale: scaleImage }}
          className="absolute inset-0 w-full h-full transform-gpu"
        >
          <ImageSlider 
            images={heroImages} 
            className="w-full h-full grayscale-[5%] scale-110" 
            imageClassName="object-cover"
            alt="Isadora e Matheus"
            interval={5000}
          />
          {/* Subtle Overlays for better image visibility while keeping text readable */}
          <div className="absolute inset-0 bg-black/15 md:bg-black/20 z-10"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/70 z-10"></div>
          <NoiseOverlay />
        </motion.div>

        {/* Text Overlay - Positioned over the image */}
        <div className="absolute inset-0 z-20 flex items-center justify-center px-6 md:px-12 lg:px-24 pointer-events-none">
          <motion.div 
            style={{ y: yText, opacity: opacityText }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl bg-black/20 backdrop-blur-[2px] md:bg-white/5 md:backdrop-blur-md pt-10 pb-8 px-8 md:pt-16 md:pb-12 md:px-12 lg:pt-20 lg:pb-16 lg:px-16 pointer-events-auto border border-white/5 md:border-white/10 text-white text-center flex flex-col items-center mt-40 md:mt-32 rounded-3xl"
          >
            <div className="w-full flex flex-col items-center">
              <div className="w-full">
                <FadeIn delay={0.15} y={40} className="w-full">
                  <h1 className="text-[14vw] sm:text-[16vw] md:text-[14vw] lg:text-[10vw] xl:text-[9.5rem] font-alex-brush font-normal text-white leading-[0.8] tracking-tight drop-shadow-2xl whitespace-nowrap overflow-visible py-4">
                    <span className="text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.3)]">Isadora & Matheus</span>
                  </h1>
                </FadeIn>
              </div>

              <FadeIn delay={0.35} y={20}>
                <TextScramble 
                  as="p"
                  className="font-body text-xl md:text-2xl italic leading-relaxed text-white/90 max-w-xl mx-auto mt-10 font-light"
                  duration={1.2}
                  speed={0.03}
                >
                  A nossa história guiada pelo amor, resultando em um momento inesquecível.
                </TextScramble>
              </FadeIn>

              <FadeIn delay={0.5} y={20}>
                <TextScramble 
                  as="span"
                  className="font-label text-xs uppercase tracking-[0.4rem] block mt-[34px] font-semibold bg-clip-text text-transparent bg-gradient-to-r from-gold via-yellow-200 to-gold drop-shadow-md"
                  duration={1.5}
                  speed={0.05}
                >
                  03 de Setembro de 2026
                </TextScramble>
              </FadeIn>

              <FadeIn delay={0.65} y={20} className="mt-[36px] mb-4 w-full flex justify-center">
                <Countdown targetDate="2026-09-03T00:00:00" />
              </FadeIn>

              <FadeIn delay={0.8} y={30} className="flex flex-col gap-4 pt-6 w-full max-w-sm mx-auto justify-center px-4">
                <SlideToUnlock
                  sliderText="Deslize para Confirmar"
                  onUnlock={() => {
                    handleLinkClick('/presenca');
                    setTimeout(() => router.push('/presenca'), 300);
                  }}
                  unlockedContent={
                    <div className="flex items-center justify-center h-12 bg-white text-black font-label uppercase tracking-[0.3em] text-[11px] rounded-sm shadow-xl px-10">
                      Abrindo...
                    </div>
                  }
                />
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    href="/eventos"
                    onClick={() => handleLinkClick('/eventos')}
                    className="flex h-12 items-center justify-center gap-2 rounded-sm border border-white/30 bg-white/10 px-4 font-label text-[10px] uppercase tracking-[0.22em] text-white backdrop-blur-sm transition-colors hover:bg-white hover:text-black"
                  >
                    <Calendar className="h-4 w-4" />
                    Eventos
                  </Link>
                  <Link
                    href="/galeria"
                    onClick={() => handleLinkClick('/galeria')}
                    className="flex h-12 items-center justify-center gap-2 rounded-sm border border-gold/50 bg-gold px-4 font-label text-[10px] uppercase tracking-[0.22em] text-black transition-colors hover:bg-yellow-500"
                  >
                    <Camera className="h-4 w-4" />
                    Galeria
                  </Link>
                </div>
              </FadeIn>

              <FadeIn delay={1.2} duration={1} className="mt-12 flex flex-col items-center gap-4">
                <Link 
                  href="#detalhes" 
                  className="group flex flex-col items-center gap-3 transition-opacity hover:opacity-100 opacity-60"
                  aria-label="Descobrir Mais"
                >
                  <motion.div
                    animate={{ y: [0, 5, 0] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    className="w-px h-16 bg-gradient-to-b from-white to-transparent"
                  />
                </Link>
              </FadeIn>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="detalhes" className="bg-surface relative z-10 w-full overflow-hidden pb-12 pt-16">
        <div className="max-w-7xl mx-auto px-6 md:px-12 text-center">
          <FadeIn>
            <TextScramble 
              as="h2"
              className="text-4xl md:text-5xl lg:text-[5rem] font-headline italic leading-none mb-6 bg-gradient-to-br from-gold via-yellow-200 to-white bg-clip-text text-transparent drop-shadow-sm"
              duration={1.2}
              speed={0.03}
            >
              Nossos Momentos
            </TextScramble>
            <TextScramble
              as="p"
              className="text-on-surface-variant font-body font-light italic text-2xl md:text-3xl max-w-xl mx-auto leading-relaxed"
              duration={1.2}
              speed={0.03}
            >
              Fotos, eventos e caminhos principais para o grande dia
            </TextScramble>
          </FadeIn>
        </div>
        <HomeMenuCards />
      </section>

      <HomeEventHighlights />

      <MarqueeGallery />

      <section id="historia" className="pb-24 pt-12 relative z-10 bg-surface text-on-surface">
        <div className="max-w-6xl mx-auto px-6 md:px-12 mb-24">
           <AnimatedText text="Com quase 10 anos construindo juntos essa caminhada, focamos em cultivar amor, respeito e alegria. Nossa história é prova viva de que parceria e companheirismo nos levam a lugares que jamais imaginamos. Esperamos você conosco nesse dia tão especial!" className="text-2xl sm:text-3xl md:text-4xl font-body italic font-light leading-relaxed max-w-4xl mx-auto" align="center" />
        </div>
        <FocusRail items={[
          {
            id: "cerimonia",
            title: "Cerimônia na Catedral",
            meta: "19:00",
            description: "O sacramento do matrimônio abre a noite em Brasília.",
            imageSrc: "/catedral-brasilia.png",
            href: "/eventos"
          },
          {
            id: "recepcao",
            title: "Recepção no NAU",
            meta: "21:00",
            description: "Jantar, celebração e roteiro da noite em um só lugar.",
            imageSrc: "/NAU.png",
            href: "/eventos"
          },
          {
            id: "pre-wedding",
            title: "Galeria dos Noivos",
            meta: "Pre-wedding",
            description: "As fotos selecionadas do ensaio já estão na galeria.",
            imageSrc: galleryImage(5, "/galeria-noivos/enim-136.webp"),
            href: "/galeria"
          },
          {
            id: "momentos",
            title: "Momentos do Ensaio",
            meta: "Fotos",
            description: "Um caminho mais leve para entrar no clima antes do evento.",
            imageSrc: galleryImage(19, "/galeria-noivos/enim-129.webp"),
            href: "/galeria"
          },
          {
            id: "grande-dia",
            title: "O Grande Dia",
            meta: "2026",
            description: "Horários, locais, traje e hospedagem estão reunidos nos detalhes do evento.",
            imageSrc: galleryImage(22, "/galeria-noivos/enim-325.webp"),
            href: "/eventos"
          }
        ]} />
      </section>



      <section id="gravata" className="py-24 relative z-10 bg-surface">
        <NoiseOverlay />
        <div className="max-w-7xl mx-auto px-6 md:px-12 text-center mb-16">
          <FadeIn>
            <span className="text-[10px] uppercase font-label tracking-[0.3em] text-secondary mb-4 block">Participe da Brincadeira</span>
            <TextScramble 
              as="h2"
              className="text-4xl md:text-5xl font-headline italic bg-clip-text text-transparent bg-gradient-to-r from-gold via-yellow-200 to-gold drop-shadow-sm mb-6"
              duration={1.2}
              speed={0.03}
            >
              A Gravata do Noivo
            </TextScramble>
            <p className="text-on-surface-variant font-body font-light text-lg max-w-2xl mx-auto mb-12">
              Acompanhe a disputa lance a lance. Quem será que leva o prêmio da família mais animada?
            </p>
          </FadeIn>
          
          <FadeIn delay={0.2}>
            <TieLeaderboard />
            
            <div className="mt-12">
              <Link href="/presentes/gravata" aria-label="Dar um lance na gravata">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gold hover:bg-yellow-500 text-black px-8 py-4 rounded-full font-label uppercase tracking-widest text-sm transition-colors shadow-lg shadow-gold/20 flex items-center gap-2 mx-auto"
                >
                  <Banknote className="w-5 h-5" />
                  Dar meu Lance
                </motion.button>
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

    </main>
  );
}
