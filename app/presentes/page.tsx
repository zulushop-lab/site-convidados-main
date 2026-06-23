'use client';

import { useState, useMemo, useRef } from 'react';
import Image from 'next/image';
import { Banknote, CreditCard, Filter, Search, X, Check, ArrowRight, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter } from 'next/navigation';

import { PageHero } from '@/components/PageHero';
import { TiltCard } from '@/components/3DTiltCard';
import { SlideToUnlock } from '@/components/SlideToUnlock';
import { GiftContributionActions } from '@/components/GiftContributionActions';
import { GIFT_CATALOG, GIFT_CATEGORIES } from '@/domain/gifts/catalog';
import type { GiftCatalogItem, GiftCategory } from '@/domain/types';

type GiftCategoryFilter = 'Todas' | GiftCategory;
type PriceRange = 'Qualquer' | '0-200' | '200-500' | '500+';

const CATEGORIES: GiftCategoryFilter[] = ['Todas', ...GIFT_CATEGORIES];

const PRICE_RANGES: { label: string; value: PriceRange }[] = [
  { label: 'Qualquer Preço', value: 'Qualquer' },
  { label: 'Até R$ 500', value: '0-200' },
  { label: 'R$ 500 - 1.500', value: '200-500' },
  { label: 'Acima de R$ 1.500', value: '500+' },
];

export default function PresentesPage() {
  const router = useRouter();
  const gifts = GIFT_CATALOG;
  const [customAmount, setCustomAmount] = useState('');
  const [activeCategory, setActiveCategory] = useState<GiftCategoryFilter>('Todas');
  const [activePriceRange, setActivePriceRange] = useState<PriceRange>('Qualquer');
  const [searchQuery, setSearchQuery] = useState('');
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedGift, setSelectedGift] = useState<GiftCatalogItem | null>(null);
  const [visibleCount, setVisibleCount] = useState(12);

  const customAmountRef = useRef<HTMLDivElement>(null);

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9,]/g, '');
    setCustomAmount(value);
  };

  const handleCustomContribution = () => {
    if (customAmount) {
      setIsConfirmModalOpen(true);
    }
  };

  const confirmContribution = () => {
    router.push(`/presentes/checkout?amount=${customAmount}&item=Contribuição Livre`);
  };

  const filteredGifts = useMemo(() => {
    return gifts.filter(gift => {
      const matchesCategory = activeCategory === 'Todas' || gift.category === activeCategory;
      const matchesSearch = gift.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            gift.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      let matchesPrice = true;
      if (activePriceRange === '0-200') matchesPrice = gift.referenceTotal <= 500;
      else if (activePriceRange === '200-500') matchesPrice = gift.referenceTotal > 500 && gift.referenceTotal <= 1500;
      else if (activePriceRange === '500+') matchesPrice = gift.referenceTotal > 1500;

      return matchesCategory && matchesSearch && matchesPrice;
    });
  }, [gifts, activeCategory, searchQuery, activePriceRange]);

  const visibleGifts = useMemo(() => {
    return filteredGifts.slice(0, visibleCount);
  }, [filteredGifts, visibleCount]);

  const clearFilters = () => {
    setActiveCategory('Todas');
    setActivePriceRange('Qualquer');
    setSearchQuery('');
    setVisibleCount(12);
  };

  return (
    <main className="relative pb-32 overflow-x-hidden">
      <PageHero 
        title="Experiências e Carinho" 
        subtitle="Lista de Presentes" 
        imageSrc="/imagem-3.jpg" 
        imageAlt="Isadora e Matheus" 
        objectPosition="center 10%"
      />

      {/* Confirmation Modal */}
      <AnimatePresence>
        {isConfirmModalOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsConfirmModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              aria-hidden="true"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-surface w-full max-w-md p-8 shadow-2xl rounded-sm border border-outline-variant/10"
            >
              <div className="flex items-center gap-3 text-primary mb-6">
                <AlertCircle className="w-6 h-6" />
                <h3 className="font-headline text-2xl italic text-on-surface">Confirmar Contribuição</h3>
              </div>
              
              <div className="space-y-4 mb-8">
                <p className="font-body text-on-surface-variant">
                  Você está prestes a realizar uma contribuição personalizada para o nosso futuro.
                </p>
                <div className="bg-surface-container-low p-4 border-l-2 border-primary">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-label text-[10px] uppercase tracking-widest text-secondary">Valor</span>
                    <span className="font-label text-[10px] uppercase tracking-widest text-secondary">Item</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-headline text-xl italic text-on-surface">R$ {customAmount}</span>
                    <span className="font-body text-sm font-medium text-primary">Contribuição Livre</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button 
                  onClick={() => setIsConfirmModalOpen(false)}
                  className="flex-1 px-6 py-4 border border-outline-variant/30 text-on-surface-variant font-label text-[10px] uppercase tracking-[0.2em] hover:bg-surface-container-high transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmContribution}
                  className="flex-1 btn-primary py-4 px-6 flex items-center justify-center gap-2"
                >
                  Confirmar <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Gift Detail Modal */}
      <AnimatePresence>
        {selectedGift && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedGift(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
              aria-hidden="true"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="relative bg-surface w-full max-w-4xl overflow-hidden shadow-2xl rounded-sm border border-outline-variant/10 grid grid-cols-1 md:grid-cols-2"
            >
              <button 
                onClick={() => setSelectedGift(null)}
                aria-label="Fechar modal"
                className="absolute top-4 right-4 z-20 w-10 h-10 flex items-center justify-center bg-white/20 backdrop-blur-md text-white rounded-full hover:bg-white/40 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="relative aspect-square md:aspect-auto h-full min-h-[300px]">
                <Image
                  src={selectedGift.imageSrc}
                  alt={selectedGift.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="p-8 lg:p-12 flex flex-col justify-center">
                <span className="font-label text-[10px] uppercase tracking-[0.4em] text-primary mb-4">{selectedGift.category}</span>
                <h3 className="font-headline text-4xl lg:text-5xl italic mb-6 text-on-surface">{selectedGift.title}</h3>
                <p className="font-body text-base text-on-surface-variant leading-relaxed mb-8">
                  {selectedGift.description}
                </p>
                
                {/* Public symbolic contribution display */}
                <div className="space-y-3 mb-8 bg-surface-container-low p-6 border-l-2 border-primary">
                  <div className="flex justify-between items-baseline">
                    <span className="font-label text-[10px] uppercase tracking-widest text-primary font-semibold">Cota mínima</span>
                    <span className="font-headline text-2xl italic text-primary">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedGift.minimumContribution)}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline border-t border-outline-variant/10 pt-3">
                    <span className="font-label text-[9px] uppercase tracking-widest text-secondary">Preço total</span>
                    <span className="font-body font-medium text-sm text-on-surface">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedGift.referenceTotal)}
                    </span>
                  </div>
                </div>

                <GiftContributionActions
                  giftTitle={selectedGift.title}
                  minimum={selectedGift.minimumContribution}
                  total={selectedGift.referenceTotal}
                  layout="modal"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Intro Section */}
      <section className="px-6 md:px-12 lg:px-24 mb-20 mt-12">
        <div className="max-w-3xl mx-auto text-center">
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="font-body text-xl text-on-surface-variant leading-relaxed mb-10 text-balance"
          >
            Sua presença é nosso maior presente. No entanto, se desejar nos honrar com um gesto para o início da nossa vida juntos, selecionamos algumas experiências para nossa lua de mel e itens simbólicos para nos apoiarem com todo carinho.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex gap-8 justify-center items-center border-t border-outline-variant/15 pt-8"
          >
            <div className="flex items-center gap-2">
              <Banknote className="text-primary w-5 h-5" />
              <span className="font-label text-[10px] uppercase tracking-wider text-on-surface/80">Pix</span>
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="text-primary w-5 h-5" />
              <span className="font-label text-[10px] uppercase tracking-wider text-on-surface/80">Cartão de Crédito</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Filter and Search Section */}
      <section className="px-6 md:px-12 lg:px-24 mb-16">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col gap-8 border-b border-outline-variant/10 pb-8">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
              {/* Category Filters */}
              <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8 w-full lg:w-auto">
                <div className="flex items-center gap-2 text-on-surface-variant mb-2 md:mb-0">
                  <Filter className="w-4 h-4" />
                  <span className="font-label text-[10px] uppercase tracking-widest">Categoria:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((category) => (
                    <button
                      key={category}
                      onClick={() => {
                        setActiveCategory(category);
                        setVisibleCount(12); // reset page count
                      }}
                      aria-pressed={activeCategory === category}
                      className={`relative px-5 py-2.5 font-label text-[10px] uppercase tracking-widest transition-all rounded-full overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                        activeCategory === category 
                          ? 'text-on-primary' 
                          : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
                      }`}
                    >
                      {activeCategory === category && (
                        <motion.div 
                          layoutId="activeCategory"
                          className="absolute inset-0 bg-primary z-0"
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                      )}
                      <span className="relative z-10 flex items-center gap-2">
                        {category}
                        {activeCategory === category && <Check className="w-3 h-3" />}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Search Input */}
              <div className="relative w-full max-w-sm">
                <label htmlFor="search-gifts" className="sr-only">Buscar presentes</label>
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50">
                  <Search className="w-4 h-4" />
                </div>
                <input 
                  id="search-gifts"
                  type="text"
                  placeholder="Buscar presente..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setVisibleCount(12); // reset page count
                  }}
                  className="w-full bg-surface-container-low border-none rounded-full pl-10 pr-10 py-3 font-body text-sm text-on-background placeholder:text-on-surface-variant/40 focus:ring-1 focus:ring-primary/30 transition-all"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    aria-label="Limpar busca"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50 hover:text-on-surface transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Price Filters (based on total item price) */}
            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
              <div className="flex items-center gap-2 text-on-surface-variant mb-2 md:mb-0">
                <div className="w-4 h-4 border border-current rounded-sm flex items-center justify-center text-[10px] font-bold">$</div>
                <span className="font-label text-[10px] uppercase tracking-widest">Preço total:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {PRICE_RANGES.map((range) => (
                  <button
                    key={range.value}
                    onClick={() => {
                      setActivePriceRange(range.value);
                      setVisibleCount(12); // reset page count
                    }}
                    aria-pressed={activePriceRange === range.value}
                    className={`relative px-5 py-2.5 font-label text-[10px] uppercase tracking-widest transition-all rounded-full overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                      activePriceRange === range.value 
                        ? 'text-on-primary' 
                        : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    {activePriceRange === range.value && (
                      <motion.div 
                        layoutId="activePriceRange"
                        className="absolute inset-0 bg-primary z-0"
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-2">
                      {range.label}
                      {activePriceRange === range.value && <Check className="w-3 h-3" />}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Gift Grid */}
      <section className="px-6 md:px-12 lg:px-24">
        <div className="max-w-6xl mx-auto">
          <>
              <motion.div 
                layout
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-12 gap-x-6 lg:gap-x-8"
              >
                <AnimatePresence mode="popLayout">
                  {visibleGifts.map((gift, index) => (
                    <motion.div 
                      key={gift.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95, y: 20 }}
                      animate={{ 
                        opacity: 1, 
                        scale: 1, 
                        y: 0,
                        transition: {
                          type: 'spring',
                          stiffness: 100,
                          damping: 20,
                          delay: (index % 6) * 0.05
                        }
                      }}
                      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                      className="group h-full w-full flex flex-col"
                    >
                      <TiltCard className="h-full w-full" intensity={10}>
                        <div 
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setSelectedGift(gift);
                            }
                          }}
                          onClick={() => setSelectedGift(gift)}
                          className="group flex flex-col h-full w-full bg-surface p-4 rounded-md transition-all duration-500 hover:bg-surface-container-lowest border border-transparent hover:border-gold/10 shadow-sm hover:shadow-2xl hover:scale-[1.02] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        >
                          {/* Image box conforming precisely to aspect-ratio 4/3 and overflow:hidden */}
                          <div className="aspect-[4/3] w-full bg-surface-container-low mb-4 overflow-hidden relative rounded-sm shadow-sm ring-1 ring-black/5">
                            <Image
                              src={gift.imageSrc}
                              alt={gift.title}
                              fill
                              priority={index < 3}
                              placeholder="blur"
                              blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
                              quality={85}
                              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                              className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute top-4 left-4 z-10">
                              <span className="bg-gold px-3 py-1 font-label text-[9px] font-semibold uppercase tracking-widest text-white shadow-sm rounded-full">
                                {gift.category}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col mb-3">
                            <h3 className="font-headline text-xl italic mb-1 text-on-surface group-hover:text-gold transition-colors duration-300">
                              {gift.title}
                            </h3>
                            <div className="flex justify-between items-baseline mt-1">
                              <span className="font-label text-[8px] uppercase tracking-wider text-on-surface-variant/70">
                                Preço total
                              </span>
                              <span className="font-body text-primary font-bold text-base">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(gift.referenceTotal)}
                              </span>
                            </div>
                            <span className="text-[10px] text-on-surface-variant/60 mt-0.5">
                              Cota mínima: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(gift.minimumContribution)}
                            </span>
                            <span className="text-[10px] text-primary/70 mt-0.5">
                              Contribua a partir de {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(gift.minimumContribution)}
                            </span>
                          </div>

                          <p className="font-body text-xs text-on-surface-variant/80 mb-5 leading-relaxed flex-1 line-clamp-2">
                            {gift.description}
                          </p>

                          <div className="mt-auto pt-4" onClick={(e) => e.stopPropagation()}>
                            <SlideToUnlock
                              onUnlock={() => {}}
                              sliderText="Deslize para Presentear"
                              unlockedContent={
                                <GiftContributionActions
                                  giftTitle={gift.title}
                                  minimum={gift.minimumContribution}
                                  total={gift.referenceTotal}
                                  layout="card"
                                />
                              }
                            />
                          </div>
                        </div>
                      </TiltCard>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>

              {/* Dynamic Load More elements to resolve LCP limits */}
              {visibleCount < filteredGifts.length && (
                <div className="flex justify-center mt-12">
                  <button
                    onClick={() => setVisibleCount((prev) => prev + 12)}
                    className="px-8 py-4 border border-gold text-gold hover:bg-gold/5 font-label text-[10px] uppercase tracking-[0.2em] transition-all rounded-sm"
                  >
                    Carregar Mais Presentes ({filteredGifts.length - visibleCount} restantes)
                  </button>
                </div>
              )}
            </>
          
          {filteredGifts.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-32 border-2 border-dashed border-outline-variant/10 rounded-lg"
            >
              <p className="font-headline text-2xl italic text-on-surface-variant">Nenhum item encontrado com estes filtros.</p>
              <button 
                onClick={clearFilters}
                className="mt-6 text-primary font-label text-[10px] uppercase tracking-widest hover:underline flex items-center gap-2 mx-auto"
              >
                Limpar filtros <X className="w-3 h-3" />
              </button>
            </motion.div>
          )}
        </div>
      </section>

      {/* Custom Amount Section with exact PRD text and stagger load delay */}
      <section ref={customAmountRef} className="mt-32 px-6 md:px-12 lg:px-24">
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ 
            opacity: 1, 
            y: 0,
            transition: {
              type: "spring",
              stiffness: 70,
              damping: 20,
              delay: 0.2 // Staggers entry in relation to final grid cards
            }
          }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto bg-surface-container-low p-12 lg:p-20 text-center border border-outline-variant/5 rounded-sm relative"
        >
          <span className="text-[10px] uppercase font-label tracking-[0.3em] text-secondary mb-4 block">Afeto Adicional</span>
          <h2 className="font-headline text-4xl lg:text-5xl italic mb-6">Contribuição Livre</h2>
          
          {/* Exact required translation block */}
          <p className="font-body text-base text-on-surface-variant/80 mb-12 max-w-2xl mx-auto leading-relaxed">
            Se mesmo após escolher um presente simbólico você ainda quiser nos ajudar a estruturar nossos primeiros passos como família, sinta-se à vontade.
          </p>

          <div className="flex flex-col md:flex-row gap-4 justify-center items-end max-w-md mx-auto">
            <div className="w-full text-left relative">
              <label htmlFor="custom-amount" className="font-label text-[10px] uppercase tracking-widest text-secondary block mb-2">Valor da Contribuição (R$)</label>
              <div className="relative">
                <span className="absolute left-0 bottom-3 font-body text-xl text-on-surface-variant">R$</span>
                <input
                  id="custom-amount"
                  type="text"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={customAmount}
                  onChange={handleCustomAmountChange}
                  className="w-full bg-transparent border-0 border-b border-outline-variant/30 py-3 pl-8 focus:outline-none focus:border-primary font-body text-xl transition-colors text-on-surface"
                />
              </div>
            </div>
            <button 
              onClick={handleCustomContribution}
              disabled={!customAmount}
              className={`w-full md:w-auto px-12 py-4 block font-label uppercase tracking-widest text-xs text-center rounded-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${customAmount ? 'btn-primary active:scale-95' : 'bg-outline-variant/30 text-on-surface-variant cursor-not-allowed opacity-50'}`}
            >
              Contribuir
            </button>
          </div>
        </motion.div>
      </section>
    </main>
  );
}
