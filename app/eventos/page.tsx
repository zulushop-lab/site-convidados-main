'use client';

import { ImageWithSkeleton } from '@/components/ImageWithSkeleton';
import { ImageSlider } from '@/components/ImageSlider';
import { MapPin } from 'lucide-react';
import { motion, useScroll, useTransform } from 'motion/react';
import { PageHero } from '@/components/PageHero';
import { useRef } from 'react';

const hotelSuggestions = [
  {
    name: 'Quality Hotel & Suítes Brasília',
    href: 'https://www.letsatlantica.com.br/hotel/quality-hotel-e-suites-brasilia',
    image: '/hoteis/quality-hotel-suites-brasilia.jpg',
    alt: 'Piscina e fachada do Quality Hotel & Suítes Brasília',
    imageClassName: '',
    titleClassName: 'items-end',
    headingClassName: 'max-w-[92%] text-[1.45rem] sm:text-3xl lg:text-[1.75rem]',
  },
  {
    name: 'Brasília Palace Hotel',
    href: 'https://www.plazabrasilia.com.br/brasilia-palace',
    image: '/hoteis/brasilia-palace-hotel.webp',
    alt: 'Fachada e placa do Brasília Palace Hotel',
    imageClassName: 'object-[center_100%] md:object-[center_62%]',
    titleClassName: 'items-end',
    headingClassName: 'max-w-[38%] text-[1.45rem] sm:text-3xl lg:text-[1.75rem]',
  },
  {
    name: 'Hotel Royal Tulip Brasília Alvorada',
    href: 'https://royal-tulip-brasilia-alvorada.goldentulip.com/pt-br/',
    image: '/hoteis/royal-tulip-brasilia-alvorada.jpg',
    alt: 'Piscina e fachada do Hotel Royal Tulip Brasília Alvorada',
    imageClassName: '',
    titleClassName: 'items-end',
    headingClassName: 'max-w-[92%] text-[1.45rem] sm:text-3xl lg:text-[1.75rem]',
  },
] as const;

function HotelCard({ hotel }: { hotel: (typeof hotelSuggestions)[number] }) {
  return (
    <motion.a
      href={hotel.href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Abrir site do hotel ${hotel.name}`}
      whileHover={{
        scale: 1.025,
        boxShadow: "0 24px 60px -20px rgba(0, 0, 0, 0.55)",
      }}
      whileTap={{ scale: 0.985 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="relative block group/hotel overflow-hidden h-[180px] sm:h-[200px] md:h-[180px] xl:h-[190px] rounded-sm shadow-md bg-black focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
    >
      <ImageWithSkeleton
        src={hotel.image}
        alt={hotel.alt}
        fill
        quality={90}
        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
        className={`object-cover brightness-[0.58] grayscale-[0.12] transition-all duration-700 group-hover/hotel:scale-110 group-hover/hotel:brightness-[0.78] ${hotel.imageClassName}`}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent transition-opacity duration-500 group-hover/hotel:opacity-95" />
      <div className={`absolute inset-0 flex p-5 sm:p-6 ${hotel.titleClassName}`}>
        <h4 className={`${hotel.headingClassName} font-headline italic text-white leading-tight drop-shadow-lg`}>
          {hotel.name}
        </h4>
      </div>
    </motion.a>
  );
}

export default function EventosPage() {
  const attireRef = useRef<HTMLDivElement>(null);
  const hotelsRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress: cardsScroll } = useScroll({
    target: cardsRef,
    offset: ["start end", "end start"]
  });

  const yCeremonyCard = useTransform(cardsScroll, [0, 1], [30, -30]);
  const yCeremonyImage = useTransform(cardsScroll, [0, 1], ["-15%", "5%"]);
  const scaleCeremonyImage = useTransform(cardsScroll, [0, 0.5, 1], [1.12, 1.15, 1.18]);
  
  const yReceptionCard = useTransform(cardsScroll, [0, 1], [60, -60]);
  const yReceptionImage = useTransform(cardsScroll, [0, 1], ["-15%", "5%"]);
  const scaleReceptionImage = useTransform(cardsScroll, [0, 0.5, 1], [1.12, 1.15, 1.18]);

  const { scrollYProgress: attireScroll } = useScroll({
    target: attireRef,
    offset: ["start end", "end start"]
  });

  const { scrollYProgress: hotelsScroll } = useScroll({
    target: hotelsRef,
    offset: ["start end", "end start"]
  });

  const yAttire = useTransform(attireScroll, [0, 1], ["-12%", "12%"]);
  const scaleAttire = useTransform(attireScroll, [0, 1], [1.15, 1.05]);
  const yTextAttire = useTransform(attireScroll, [0, 1], [20, -20]);
  const yTextHotels = useTransform(hotelsScroll, [0, 1], [20, -20]);

  return (
    <main className="relative pb-32 overflow-x-hidden">
      <PageHero 
        title="Detalhes do Evento" 
        subtitle="Da cerimônia à recepção" 
        images={["/catedral-brasilia.png", "/NAU.png"]} 
        imageClassName="object-cover"
        imageAlt="Locais do Evento" 
        objectPosition="center mb-4"
      />

      {/* Ceremony & Reception Cards */}
      <section ref={cardsRef} className="relative px-6 md:px-12 lg:px-24 py-20 grid grid-cols-1 lg:grid-cols-2 gap-12 overflow-hidden">
        {/* Ceremony Card */}
        <motion.div 
          style={{ y: yCeremonyCard }}
          initial={{ opacity: 0, y: 100, filter: 'blur(15px)' }}
          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          whileHover="hover"
          whileTap={{ scale: 0.985 }}
          viewport={{ once: true, margin: "-100px" }}
          variants={{
            hover: {
              scale: 1.01,
              boxShadow: "0 40px 80px -15px rgba(0, 0, 0, 0.3)",
              y: -8
            }
          }}
          transition={{ 
            duration: 1.5,
            ease: [0.22, 1, 0.36, 1],
            boxShadow: { duration: 0.4 }
          }}
          className="relative group overflow-hidden aspect-square md:aspect-[3/2] rounded-sm shadow-xl cursor-pointer bg-surface transition-shadow"
        >
          <motion.div
            style={{ y: yCeremonyImage, scale: scaleCeremonyImage }}
            variants={{
              hover: { scale: 1.2 }
            }}
            transition={{ duration: 2.5, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 h-[120%] w-full"
          >
            <ImageWithSkeleton
              src="/catedral-brasilia.png"
              alt="Catedral de Brasília"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              quality={90}
              className="object-cover grayscale-[10%]"
              referrerPolicy="no-referrer"
            />
          </motion.div>
          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-center p-6 sm:p-10 transition-all duration-500 group-hover:bg-black/70">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="space-y-3 sm:space-y-6 max-w-[92%]"
            >
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ 
                  delay: 0.4, 
                  duration: 1, 
                  type: "spring", 
                  stiffness: 260, 
                  damping: 20 
                }}
                className="mb-4"
              >
                <MapPin className="text-white/40 w-10 h-10 mx-auto" strokeWidth={1.5} />
              </motion.div>
              <span className="font-label uppercase tracking-[0.4rem] text-[8px] sm:text-[10px] text-white/80 drop-shadow-sm">A Cerimônia</span>
              <h3 className="text-3xl sm:text-4xl md:text-5xl font-headline italic text-white leading-tight tracking-tight drop-shadow-md">Catedral</h3>
              <p className="text-white/90 font-body text-sm sm:text-base md:text-lg tracking-wide leading-relaxed drop-shadow-sm">
                19:00 - 21:00<br />
                Esplanada dos Ministérios, lote 12, Brasília - DF
              </p>
              <div className="pt-4 sm:pt-8">
                <a 
                  href="https://www.google.com/maps/search/?api=1&query=Catedral+Metropolitana+Nossa+Senhora+Aparecida+Brasília" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  aria-label="Ver localização da Catedral de Brasília no Google Maps"
                  className="inline-block bg-white text-black font-label uppercase tracking-[0.2rem] text-[9px] sm:text-[10px] px-8 sm:px-10 py-3 sm:py-4 hover:bg-white/90 transition-all active:scale-95 shadow-lg"
                >
                  Ver no Mapa
                </a>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Reception Card */}
        <motion.div 
          style={{ y: yReceptionCard }}
          initial={{ opacity: 0, y: 120, filter: 'blur(15px)' }}
          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          whileHover="hover"
          whileTap={{ scale: 0.985 }}
          viewport={{ once: true, margin: "-100px" }}
          variants={{
            hover: {
              scale: 1.01,
              boxShadow: "0 40px 80px -15px rgba(0, 0, 0, 0.3)",
              y: -8
            }
          }}
          transition={{ 
            duration: 1.5,
            ease: [0.22, 1, 0.36, 1],
            delay: 0.1,
            boxShadow: { duration: 0.4 }
          }}
          className="relative group overflow-hidden aspect-square md:aspect-[3/2] rounded-sm shadow-xl cursor-pointer bg-surface transition-shadow"
        >
          <motion.div
            style={{ y: yReceptionImage, scale: scaleReceptionImage }}
            variants={{
              hover: { scale: 1.2 }
            }}
            transition={{ duration: 2.5, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 h-[120%] w-full"
          >
            <ImageWithSkeleton
              src="/NAU.png"
              alt="NAU Frutos do Mar"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              quality={90}
              className="object-cover grayscale-[10%]"
              referrerPolicy="no-referrer"
            />
          </motion.div>
          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-center p-6 sm:p-10 transition-all duration-500 group-hover:bg-black/70">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="space-y-3 sm:space-y-6 max-w-[92%]"
            >
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ 
                  delay: 0.4, 
                  duration: 1, 
                  type: "spring", 
                  stiffness: 260, 
                  damping: 20 
                }}
                className="mb-4"
              >
                <MapPin className="text-white/40 w-10 h-10 mx-auto" strokeWidth={1.5} />
              </motion.div>
              <span className="font-label uppercase tracking-[0.4rem] text-[8px] sm:text-[10px] text-white/80 drop-shadow-sm">A Recepção</span>
              <h3 className="text-3xl sm:text-4xl md:text-5xl font-headline italic text-white leading-tight tracking-tight drop-shadow-md">NAU Frutos do mar - Lago</h3>
              <p className="text-white/90 font-body text-sm sm:text-base md:text-lg tracking-wide leading-relaxed drop-shadow-sm">
                21:00 - 02:00<br />
                SCES Trecho 2, Conjunto 31/32 - Próximo à Ponte JK
              </p>
              <div className="pt-4 sm:pt-8">
                <a 
                  href="https://www.google.com/maps/search/?api=1&query=NAU+Frutos+do+Mar+Brasília+Lago+Sul" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  aria-label="Ver localização do Restaurante NAU no Google Maps"
                  className="inline-block bg-white text-black font-label uppercase tracking-[0.2rem] text-[9px] sm:text-[10px] px-8 sm:px-10 py-3 sm:py-4 hover:bg-white/90 transition-all active:scale-95 shadow-lg"
                >
                  Ver no Mapa
                </a>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Timeline Section */}
      <section className="bg-surface-container-low py-24 px-6 md:px-12 section-optimized">
        <div className="max-w-screen-md mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-headline italic text-primary">O Ritmo do Dia</h2>
          </motion.div>
          <div className="relative">
            {/* Central Line */}
            <motion.div 
              initial={{ height: 0 }}
              whileInView={{ height: '100%' }}
              viewport={{ once: true }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="absolute left-0 md:left-1/2 top-0 bottom-0 w-[1px] bg-primary-fixed-dim origin-top"
            ></motion.div>

            {/* Timeline Items */}
            <motion.div
              initial="initial"
              whileInView="animate"
              viewport={{ once: true, margin: "-100px" }}
              variants={{
                initial: { opacity: 0 },
                animate: { 
                  opacity: 1,
                  transition: { staggerChildren: 0.12, delayChildren: 0.1 } 
                }
              }}
            >
              {[
                { time: "19:00", title: "O Sacramento do matrimônio", desc: "Troca de votos na capela histórica seguida de breve sessão de fotos com padrinhos", side: "right" },
                { time: "21:00", title: "Deslocamento", desc: "Percurso da Catedral para o NAU (10 - 15 minutos de carro)", side: "left" },
                { time: "21:15", title: "Recepção", desc: "Recepção inicial dos convidados no restaurante", side: "right" },
                { time: "21:30", title: "Entrada dos noivos", desc: "Boas-vindas oficial aos convidados", side: "left" },
                { time: "22:00", title: "Jantar", desc: "Jantar especial servido pelo NAU", side: "right" },
                { time: "01:30", title: "Encerramento", desc: "Preparação para o término pontual", side: "left" }
              ].map((item, index) => (
                <motion.div 
                  key={index}
                  variants={{
                    initial: { opacity: 0, y: 30 },
                    animate: { 
                      opacity: 1, 
                      y: 0,
                      transition: { 
                        duration: 1.5, 
                        ease: [0.22, 1, 0.36, 1],
                        staggerChildren: 0.1,
                        delayChildren: 0.2
                      } 
                    }
                  }}
                  className={`relative pl-8 md:pl-0 mb-16 md:flex items-center ${item.side === 'left' ? 'md:flex-row-reverse' : ''}`}
                >
                  {/* Time (Desktop) */}
                  <motion.div 
                    variants={{
                      initial: { opacity: 0, scale: 0.8, x: item.side === 'right' ? 20 : -20 },
                      animate: { opacity: 1, scale: 1, x: 0, transition: { duration: 0.8, ease: "easeOut" } }
                    }}
                    className={`hidden md:block w-1/2 ${item.side === 'right' ? 'text-right pr-12' : 'pl-12'}`}
                  >
                    <span className="font-label text-xs tracking-[0.25em] text-secondary/60 uppercase">{item.time}</span>
                  </motion.div>

                  {/* Indicator Dot */}
                  <motion.div 
                    variants={{
                      initial: { opacity: 0, scale: 0, y: 10 },
                      animate: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 20 } }
                    }}
                    className="absolute left-[-2px] md:left-1/2 md:translate-x-[-50%] w-2 h-2 bg-primary rounded-full shadow-[0_0_12px_rgba(var(--primary),0.5)]"
                  ></motion.div>

                  {/* Text Content */}
                  <motion.div 
                    variants={{
                      initial: { opacity: 0, scale: 0.9, x: item.side === 'right' ? -20 : 20, filter: 'blur(4px)' },
                      animate: { opacity: 1, scale: 1, x: 0, filter: 'blur(0px)', transition: { duration: 1, ease: "easeOut" } }
                    }}
                    className={`md:w-1/2 ${item.side === 'right' ? 'md:pl-12' : 'md:text-right md:pr-12'}`}
                  >
                    <motion.span 
                      variants={{ initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 } }}
                      className="md:hidden font-label text-[10px] tracking-[0.2em] text-secondary/60 uppercase block mb-2"
                    >
                      {item.time}
                    </motion.span>
                    <motion.h4 
                      variants={{ initial: { opacity: 0, y: 5 }, animate: { opacity: 1, y: 0 } }}
                      className="text-xl font-headline text-primary italic leading-tight"
                    >
                      {item.title}
                    </motion.h4>
                    <motion.p 
                      variants={{ initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 } }}
                      className="text-[13px] text-on-surface-variant mt-2 font-body leading-relaxed max-w-sm md:max-w-none ml-0 md:ml-auto md:mr-0"
                    >
                      {item.desc}
                    </motion.p>
                  </motion.div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Practical Info Grid */}
      <section className="relative px-6 md:px-12 py-24 max-w-screen-xl mx-auto section-optimized">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 border-t border-outline-variant/20 pt-16">
          <motion.div
            ref={attireRef}
            initial={{ opacity: 0, y: 60, scale: 0.96, filter: 'blur(12px)' }}
            whileInView={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            whileHover={{ y: -12 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
            className="relative overflow-hidden group min-h-[420px] sm:min-h-[480px] md:min-h-[520px] flex flex-col justify-end p-8 sm:p-12 md:p-16 rounded-sm shadow-md transition-all duration-500 hover:shadow-2xl"
          >
            <motion.div 
              style={{ y: yAttire, scale: scaleAttire }}
              className="absolute inset-0 -z-10 h-[140%] w-full"
            >
              <ImageSlider
                images={[
                  "https://images.unsplash.com/photo-1593032465175-481ac7f401a0?q=80&w=1600&auto=format&fit=crop",
                  "https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=1600&auto=format&fit=crop"
                ]}
                className="w-full h-full brightness-[0.4] grayscale-[0.2]"
                imageClassName="object-cover transition-all duration-1000 group-hover:brightness-[1.25] group-hover:scale-110"
                interval={4000}
                alt="Traje"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
            </motion.div>
            <motion.div style={{ y: yTextAttire }} className="relative z-10">
              <span className="font-label uppercase tracking-[0.3rem] text-[9px] sm:text-[11px] text-white/60 mb-6 block border-l border-white/30 pl-4">O Traje</span>
              <h3 className="text-3xl sm:text-4xl md:text-5xl font-headline italic text-white leading-tight drop-shadow-lg">Passeio Completo</h3>
              <p className="mt-6 text-white/80 font-body text-sm sm:text-base leading-relaxed max-w-md drop-shadow-md">Convidamos nossos convidados a vestirem seu melhor traje formal. Vestidos longos e ternos pretos são bem-vindos para celebrar conosco.</p>
            </motion.div>
          </motion.div>

          <motion.div
            ref={hotelsRef}
            initial={{ opacity: 0, y: 60, scale: 0.96, filter: 'blur(12px)' }}
            whileInView={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 1.4, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex flex-col justify-center"
          >
            <motion.div style={{ y: yTextHotels }} className="relative z-10 mb-8">
              <span className="font-label uppercase tracking-[0.3rem] text-[9px] sm:text-[11px] text-secondary/60 mb-6 block border-l border-outline/40 pl-4">Hospedagem</span>
              <h3 className="text-3xl sm:text-4xl md:text-5xl font-headline italic text-primary leading-tight">Sugestões Locais</h3>
              <p className="mt-6 text-on-surface-variant font-body text-sm sm:text-base leading-relaxed max-w-md">Para sua maior comodidade, selecionamos algumas opções de hotéis próximos ao evento com excelente custo-benefício e localização privilegiada.</p>
            </motion.div>
            <motion.div className="grid grid-cols-1 gap-4">
              {hotelSuggestions.map((hotel) => (
                <HotelCard key={hotel.name} hotel={hotel} />
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
