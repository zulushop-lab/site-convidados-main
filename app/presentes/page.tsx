'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Banknote, CreditCard, Filter, Search, X, Check, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter } from 'next/navigation';
import { collection, getDocs, setDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { handleFirestoreError, OperationType } from '@/lib/firestore-errors';

import { PageHero } from '@/components/PageHero';
import { TiltCard } from '@/components/3DTiltCard';
import { SlideToUnlock } from '@/components/SlideToUnlock';

type GiftCategory = 'Todas' | 'Primeiros Passos' | 'Lua de Mel' | 'Casa';
type PriceRange = 'Qualquer' | '0-200' | '200-500' | '500+';

interface Gift {
  id: string;
  title: string;
  category: GiftCategory;
  price: number; // Represents valor_cota for backwards compatibility and sorting
  preco_total: number;
  cotas_disponiveis: number;
  valor_cota: number;
  description: string;
  imageSrc: string;
}

const DEFAULT_GIFTS: Gift[] = [
  // Category: Primeiros Passos
  {
    id: "pp_01",
    title: "Primeira feira do mês da casa nova",
    category: "Primeiros Passos",
    price: 84.99,
    preco_total: 849.90,
    cotas_disponiveis: 10,
    valor_cota: 84.99,
    description: "Aquela ida ao mercado para garantir a geladeira cheia no primeiro mês.",
    imageSrc: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600"
  },
  {
    id: "pp_02",
    title: "Ajuda para o boleto da internet",
    category: "Primeiros Passos",
    price: 54.75,
    preco_total: 219.00,
    cotas_disponiveis: 4,
    valor_cota: 54.75,
    description: "Fundamental para não perdermos o contato e garantirmos o streaming.",
    imageSrc: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=600"
  },
  {
    id: "pp_03",
    title: "Fundo para contas de água e luz",
    category: "Primeiros Passos",
    price: 52.90,
    preco_total: 529.00,
    cotas_disponiveis: 10,
    valor_cota: 52.90,
    description: "Para a paz de espírito caso o ar condicionado precise trabalhar mais.",
    imageSrc: "https://images.unsplash.com/photo-1542382156909-9ae37b3f56fd?auto=format&fit=crop&q=80&w=600"
  },
  {
    id: "pp_04",
    title: "Kit Limpeza Extrema",
    category: "Primeiros Passos",
    price: 63.30,
    preco_total: 189.90,
    cotas_disponiveis: 3,
    valor_cota: 63.30,
    description: "Produtos de limpeza pesada para os dias de faxina.",
    imageSrc: "https://images.unsplash.com/photo-1581578731548-c64695cc6954?auto=format&fit=crop&q=80&w=600"
  },
  {
    id: "pp_05",
    title: "Rodízio de Pizza na primeira sexta",
    category: "Primeiros Passos",
    price: 53.00,
    preco_total: 159.00,
    cotas_disponiveis: 3,
    valor_cota: 53.00,
    description: "Porque ninguém quer cozinhar na primeira sexta-feira pós-mudança.",
    imageSrc: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=600"
  },
  {
    id: "pp_06",
    title: "Reserva de Emergência da Casa",
    category: "Primeiros Passos",
    price: 50.00,
    preco_total: 1250.00,
    cotas_disponiveis: 25,
    valor_cota: 50.00,
    description: "Aquele fundo para imprevistos (um cano que vaza, uma lâmpada que queima).",
    imageSrc: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=600"
  },
  {
    id: "pp_07",
    title: "Estoque de Café Especial",
    category: "Primeiros Passos",
    price: 66.50,
    preco_total: 199.50,
    cotas_disponiveis: 3,
    valor_cota: 66.50,
    description: "Cápsulas e grãos selecionados (Baggio/3 Corações) para o combustível diário.",
    imageSrc: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=600"
  },
  {
    id: "pp_08",
    title: "Assinatura Anual de Streaming",
    category: "Primeiros Passos",
    price: 89.80,
    preco_total: 538.80,
    cotas_disponiveis: 6,
    valor_cota: 89.80,
    description: "Para as noites de cinema em casa no sofá novo.",
    imageSrc: "https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?auto=format&fit=crop&q=80&w=600"
  },
  {
    id: "pp_09",
    title: "Primeiro Churrasco na Casa Nova",
    category: "Primeiros Passos",
    price: 89.75,
    preco_total: 359.00,
    cotas_disponiveis: 4,
    valor_cota: 89.75,
    description: "Carnes, carvão e bebidas para inaugurar a casa.",
    imageSrc: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=600"
  },
  {
    id: "pp_10",
    title: "Jogo de Ferramentas Básico",
    category: "Primeiros Passos",
    price: 57.47,
    preco_total: 229.90,
    cotas_disponiveis: 4,
    valor_cota: 57.47,
    description: "Kit de chaves e furadeira para pendurar quadros e montar móveis.",
    imageSrc: "https://images.unsplash.com/photo-1581147036324-c17ac41dfa6c?auto=format&fit=crop&q=80&w=600"
  },
  // Category: Lua de Mel
  {
    id: "lm_01",
    title: "Croissant e Café em Montmartre",
    category: "Lua de Mel",
    price: 69.50,
    preco_total: 139.00,
    cotas_disponiveis: 2,
    valor_cota: 69.50,
    description: "Café da manhã clássico parisiense antes de explorar a cidade.",
    imageSrc: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=600"
  },
  {
    id: "lm_02",
    title: "Passeio de Barco pelo Rio Sena",
    category: "Lua de Mel",
    price: 71.50,
    preco_total: 429.00,
    cotas_disponiveis: 6,
    valor_cota: 71.50,
    description: "Tour ao pôr do sol para ver Paris iluminada.",
    imageSrc: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&q=80&w=600"
  },
  {
    id: "lm_03",
    title: "Jantar Romântico na Torre Eiffel",
    category: "Lua de Mel",
    price: 104.08,
    preco_total: 1249.00,
    cotas_disponiveis: 12,
    valor_cota: 104.08,
    description: "Experiência gastronômica com vista para a cidade luz.",
    imageSrc: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=600"
  },
  {
    id: "lm_04",
    title: "Ingressos Miniatur Wunderland",
    category: "Lua de Mel",
    price: 79.75,
    preco_total: 319.00,
    cotas_disponiveis: 4,
    valor_cota: 79.75,
    description: "Visita à maior maquete ferroviária do mundo em Hamburgo.",
    imageSrc: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&q=80&w=600"
  },
  {
    id: "lm_05",
    title: "Tour por Speicherstadt",
    category: "Lua de Mel",
    price: 73.00,
    preco_total: 219.00,
    cotas_disponiveis: 3,
    valor_cota: 73.00,
    description: "Passeio pelo bairro histórico dos armazéns em Hamburgo.",
    imageSrc: "https://images.unsplash.com/photo-1449034446853-66c86144b0ad?auto=format&fit=crop&q=80&w=600"
  },
  {
    id: "lm_06",
    title: "Jantar de Despedida na Alemanha",
    category: "Lua de Mel",
    price: 97.80,
    preco_total: 489.00,
    cotas_disponiveis: 5,
    valor_cota: 97.80,
    description: "Comida típica e cerveja local.",
    imageSrc: "https://images.unsplash.com/photo-1568254183919-78a4f43a2877?auto=format&fit=crop&q=80&w=600"
  },
  {
    id: "lm_07",
    title: "Tickets Museu do Louvre",
    category: "Lua de Mel",
    price: 69.98,
    preco_total: 349.90,
    cotas_disponiveis: 5,
    valor_cota: 69.98,
    description: "Entrada sem filas para o maior museu de arte do mundo.",
    imageSrc: "https://images.unsplash.com/photo-1601887389937-0b02c26b6c3c?auto=format&fit=crop&q=80&w=600"
  },
  {
    id: "lm_08",
    title: "Degustação de Vinhos",
    category: "Lua de Mel",
    price: 98.16,
    preco_total: 589.00,
    cotas_disponiveis: 6,
    valor_cota: 98.16,
    description: "Experiência guiada de queijos e vinhos em adega parisiense.",
    imageSrc: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&q=80&w=600"
  },
  {
    id: "lm_09",
    title: "Transporte Aeroporto CDG",
    category: "Lua de Mel",
    price: 83.80,
    preco_total: 419.00,
    cotas_disponiveis: 5,
    valor_cota: 83.80,
    description: "Transfer seguro do aeroporto Charles de Gaulle até o hotel.",
    imageSrc: "https://images.unsplash.com/photo-1540962351504-03099e0a754b?auto=format&fit=crop&q=80&w=600"
  },
  {
    id: "lm_10",
    title: "Concerto Filarmônica de Elba",
    category: "Lua de Mel",
    price: 95.80,
    preco_total: 479.00,
    cotas_disponiveis: 5,
    valor_cota: 95.80,
    description: "Ingressos para a icônica Elbphilharmonie em Hamburgo.",
    imageSrc: "https://images.unsplash.com/photo-1507838153414-b4b713384a76?auto=format&fit=crop&q=80&w=600"
  },
  {
    id: "lm_11",
    title: "Almoço no Fish Market",
    category: "Lua de Mel",
    price: 86.33,
    preco_total: 259.00,
    cotas_disponiveis: 3,
    valor_cota: 86.33,
    description: "Culinária tradicional pesqueira em Hamburgo.",
    imageSrc: "https://images.unsplash.com/photo-1534482421-64566f976cfa?auto=format&fit=crop&q=80&w=600"
  },
  {
    id: "lm_12",
    title: "Passagem de trem TGV Paris-Hamburgo",
    category: "Lua de Mel",
    price: 145.90,
    preco_total: 1459.00,
    cotas_disponiveis: 10,
    valor_cota: 145.90,
    description: "O trajeto principal da nossa lua de mel cruzando a Europa.",
    imageSrc: "https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&q=80&w=600"
  },
  // Category: Casa
  {
    id: "cs_01",
    title: "Robô Aspirador Inteligente",
    category: "Casa",
    price: 103.32,
    preco_total: 1549.90,
    cotas_disponiveis: 15,
    valor_cota: 103.32,
    description: "Para a casa ficar limpa enquanto a gente trabalha.",
    imageSrc: "https://images.unsplash.com/photo-1518133680790-399fcd6a5095?auto=format&fit=crop&q=80&w=600"
  },
  {
    id: "cs_02",
    title: "Máquina de Café Expresso",
    category: "Casa",
    price: 82.90,
    preco_total: 829.00,
    cotas_disponiveis: 10,
    valor_cota: 82.90,
    description: "Combustível diário com qualidade profissional.",
    imageSrc: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&q=80&w=600"
  },
  {
    id: "cs_03",
    title: "Jogo de Panelas Antiaderentes",
    category: "Casa",
    price: 81.12,
    preco_total: 649.00,
    cotas_disponiveis: 8,
    valor_cota: 81.12,
    description: "Para não queimar o jantar.",
    imageSrc: "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&q=80&w=600"
  },
  {
    id: "cs_04",
    title: "Air Fryer 5 Litros",
    category: "Casa",
    price: 79.98,
    preco_total: 479.90,
    cotas_disponiveis: 6,
    valor_cota: 79.98,
    description: "A salvadora das refeições rápidas e saudáveis.",
    imageSrc: "https://images.unsplash.com/photo-1621972750749-0fbb1abb7736?auto=format&fit=crop&q=80&w=600"
  },
  {
    id: "cs_05",
    title: "Jogo de Lençóis 400 Fios",
    category: "Casa",
    price: 83.80,
    preco_total: 419.00,
    cotas_disponiveis: 5,
    valor_cota: 83.80,
    description: "Conforto máximo para o descanso.",
    imageSrc: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=80&w=600"
  },
  {
    id: "cs_06",
    title: "Faqueiro Inox 72 Peças",
    category: "Casa",
    price: 89.75,
    preco_total: 359.00,
    cotas_disponiveis: 4,
    valor_cota: 89.75,
    description: "Para receber visitas com a mesa arrumada.",
    imageSrc: "https://images.unsplash.com/photo-1543510473-ac2c35329a28?auto=format&fit=crop&q=80&w=600"
  },
  {
    id: "cs_07",
    title: "Smart TV 55\" 4K",
    category: "Casa",
    price: 144.95,
    preco_total: 2899.00,
    cotas_disponiveis: 20,
    valor_cota: 144.95,
    description: "Para assistir séries e filmes com alta qualidade.",
    imageSrc: "https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&q=80&w=600"
  },
  {
    id: "cs_08",
    title: "Micro-ondas Espelhado 32L",
    category: "Casa",
    price: 74.99,
    preco_total: 749.90,
    cotas_disponiveis: 10,
    valor_cota: 74.99,
    description: "Design moderno e praticidade no dia a dia.",
    imageSrc: "https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?auto=format&fit=crop&q=80&w=600"
  },
  {
    id: "cs_09",
    title: "Jogo de Taças de Cristal",
    category: "Casa",
    price: 82.25,
    preco_total: 329.00,
    cotas_disponiveis: 4,
    valor_cota: 82.25,
    description: "Para os brindes de comemoração.",
    imageSrc: "https://images.unsplash.com/photo-1574926053821-79c5e338a933?auto=format&fit=crop&q=80&w=600"
  },
  {
    id: "cs_10",
    title: "Liquidificador Potente",
    category: "Casa",
    price: 72.25,
    preco_total: 289.00,
    cotas_disponiveis: 4,
    valor_cota: 72.25,
    description: "Com copo de vidro resistente para vitaminas e sucos.",
    imageSrc: "https://images.unsplash.com/photo-1578643463396-0997cb5328c1?auto=format&fit=crop&q=80&w=600"
  },
  {
    id: "cs_11",
    title: "Aparelho de Jantar 30 Peças",
    category: "Casa",
    price: 89.83,
    preco_total: 539.00,
    cotas_disponiveis: 6,
    valor_cota: 89.83,
    description: "Porcelana resistente para todas as refeições.",
    imageSrc: "https://images.unsplash.com/photo-1577140917170-285929fb55b7?auto=format&fit=crop&q=80&w=600"
  },
  {
    id: "cs_12",
    title: "Kit de Tábuas e Facas do Chef",
    category: "Casa",
    price: 63.30,
    preco_total: 189.90,
    cotas_disponiveis: 3,
    valor_cota: 63.30,
    description: "Equipamento essencial para cozinhar melhor.",
    imageSrc: "https://images.unsplash.com/photo-1593113630400-ea4288922497?auto=format&fit=crop&q=80&w=600"
  },
  {
    id: "cs_13",
    title: "Ferro de Passar a Vapor",
    category: "Casa",
    price: 62.25,
    preco_total: 249.00,
    cotas_disponiveis: 4,
    valor_cota: 62.25,
    description: "Para roupas impecáveis antes do trabalho.",
    imageSrc: "https://images.unsplash.com/photo-1479064555552-3ef4979f8908?auto=format&fit=crop&q=80&w=600"
  },
  {
    id: "cs_14",
    title: "Câmera de Segurança Wi-Fi",
    category: "Casa",
    price: 89.75,
    preco_total: 359.00,
    cotas_disponiveis: 4,
    valor_cota: 89.75,
    description: "Monitoramento interno para segurança da nova casa.",
    imageSrc: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&q=80&w=600"
  },
  {
    id: "cs_15",
    title: "Geladeira Frost Free Inox",
    category: "Casa",
    price: 107.47,
    preco_total: 4299.00,
    cotas_disponiveis: 40,
    valor_cota: 107.47,
    description: "O eletrodoméstico mais importante da cozinha.",
    imageSrc: "https://images.unsplash.com/photo-1571175432240-62e92bc44a86?auto=format&fit=crop&q=80&w=600"
  }
];

const CATEGORIES: GiftCategory[] = ['Todas', 'Primeiros Passos', 'Lua de Mel', 'Casa'];

const PRICE_RANGES: { label: string; value: PriceRange }[] = [
  { label: 'Qualquer Preço', value: 'Qualquer' },
  { label: 'Até R$ 75', value: '0-200' }, // Mapping '0-200' label dynamically to cota values
  { label: 'R$ 75 - 100', value: '200-500' },
  { label: 'Acima de R$ 100', value: '500+' },
];

export default function PresentesPage() {
  const router = useRouter();
  const [gifts, setGifts] = useState<Gift[]>(DEFAULT_GIFTS); // Fallback standard
  const [isLoading, setIsLoading] = useState(true);
  const [customAmount, setCustomAmount] = useState('');
  const [activeCategory, setActiveCategory] = useState<GiftCategory>('Todas');
  const [activePriceRange, setActivePriceRange] = useState<PriceRange>('Qualquer');
  const [searchQuery, setSearchQuery] = useState('');
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedGift, setSelectedGift] = useState<Gift | null>(null);
  
  // Pagination State to respect LCP for 37 high-res images
  const [visibleCount, setVisibleCount] = useState(12);

  const customAmountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchGifts = async () => {
      try {
        const giftQuery = query(collection(db, 'gifts'), orderBy('price', 'asc'));
        const querySnapshot = await getDocs(giftQuery);
        
        if (querySnapshot.empty || querySnapshot.size !== DEFAULT_GIFTS.length) {
          // Comprehensive seed / update with the full list of 37 premium items
          const seedGifts = async () => {
            const promises = DEFAULT_GIFTS.map((gift) => {
              return setDoc(doc(db, 'gifts', gift.id), gift);
            });
            await Promise.all(promises);
            fetchGifts(); // Re-fetch after seeding completes
          };
          seedGifts();
          return;
        }

        const giftsData: Gift[] = [];
        querySnapshot.forEach((doc) => {
          giftsData.push({ id: doc.id, ...doc.data() } as Gift);
        });
        setGifts(giftsData);
        setIsLoading(false);
      } catch (error) {
        setIsLoading(false);
        // Fallback to local static data if Firebase throws an error
        setGifts(DEFAULT_GIFTS);
        console.warn('Firebase error, loaded local wedding database:', error);
      }
    };

    fetchGifts();
  }, []);

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9,]/g, '');
    setCustomAmount(value);
  };

  const handleShortcutClick = (amount: number) => {
    // Format appropriately with commas
    setCustomAmount(amount.toFixed(2).replace('.', ','));
    if (customAmountRef.current) {
      const offset = 100;
      const elementPosition = customAmountRef.current.getBoundingClientRect().top + window.pageYOffset;
      window.scrollTo({
        top: elementPosition - offset,
        behavior: 'smooth'
      });
    }
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
      // Filtering mapped to cota price (valor_cota)
      if (activePriceRange === '0-200') matchesPrice = gift.valor_cota <= 75;
      else if (activePriceRange === '200-500') matchesPrice = gift.valor_cota > 75 && gift.valor_cota <= 100;
      else if (activePriceRange === '500+') matchesPrice = gift.valor_cota > 100;

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
                aria-label="Refechar modal"
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
                
                {/* Fractional pricing display matching PRD */}
                <div className="space-y-3 mb-8 bg-surface-container-low p-6 border-l-2 border-primary">
                  <div className="flex justify-between items-baseline pb-1">
                    <span className="font-label text-[9px] uppercase tracking-widest text-secondary">Valor Total</span>
                    <span className="font-body font-medium text-sm text-on-surface">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedGift.preco_total)}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline pb-1">
                    <span className="font-label text-[9px] uppercase tracking-widest text-secondary">Cotas Disponíveis</span>
                    <span className="font-body font-medium text-sm text-on-surface">
                      {selectedGift.cotas_disponiveis} cotas
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline pt-2 border-t border-outline-variant/10">
                    <span className="font-label text-[10px] uppercase tracking-widest text-primary font-semibold">Valor por Cota</span>
                    <span className="font-headline text-2xl italic text-primary">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedGift.valor_cota)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Link 
                    href={`/presentes/checkout?amount=${selectedGift.valor_cota.toFixed(2).replace('.', ',')}&item=${encodeURIComponent(selectedGift.title)}`}
                    className="flex-1 btn-primary py-5 px-8 flex items-center justify-center gap-3 text-sm font-semibold"
                  >
                    Contribuir c/ 1 Cota <ArrowRight className="w-5 h-5" />
                  </Link>
                  <button 
                    onClick={() => {
                      handleShortcutClick(selectedGift.valor_cota);
                      setSelectedGift(null);
                    }}
                    className="flex-1 px-8 py-5 border border-outline-variant/30 font-label text-[10px] uppercase tracking-widest hover:bg-surface-container-low transition-colors"
                  >
                    Ajustar Valor
                  </button>
                </div>
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
            Sua presença é nosso maior presente. No entanto, se desejar nos honrar com um gesto para o início da nossa vida juntos, selecionamos algumas experiências para nossa lua de mel e itens de cotas imateriais para nos apoiarem com todo carinho.
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

            {/* Price Filters (based on cota value) */}
            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
              <div className="flex items-center gap-2 text-on-surface-variant mb-2 md:mb-0">
                <div className="w-4 h-4 border border-current rounded-sm flex items-center justify-center text-[10px] font-bold">$</div>
                <span className="font-label text-[10px] uppercase tracking-widest">Cota Individual:</span>
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
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <p className="font-label text-[10px] uppercase tracking-widest text-secondary">Carregando presentes...</p>
            </div>
          ) : (
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
                              <span className="bg-white/95 backdrop-blur-sm px-3 py-1 font-label text-[8px] uppercase tracking-widest text-primary shadow-sm rounded-full">
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
                                Cotas: {gift.cotas_disponiveis}x de
                              </span>
                              <span className="font-body text-primary font-bold text-base">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(gift.valor_cota)}
                              </span>
                            </div>
                            <span className="text-[10px] text-on-surface-variant/50 mt-0.5">
                              Valor total: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(gift.preco_total)}
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
                                <div className="flex flex-col gap-3">
                                  <motion.div whileTap={{ scale: 0.95 }}>
                                    <Link 
                                      href={`/presentes/checkout?amount=${gift.valor_cota.toFixed(2).replace('.', ',')}&item=${encodeURIComponent(gift.title)}`} 
                                      aria-label={`Contribuir com R$ ${gift.valor_cota} para ${gift.title}`}
                                      className="btn-primary w-full py-3 block text-center shadow-lg shadow-primary/10 hover:shadow-primary/30 transition-shadow text-xs font-semibold"
                                    >
                                      Contribuir com 1 Cota
                                    </Link>
                                  </motion.div>
                                  <button 
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleShortcutClick(gift.valor_cota);
                                    }}
                                    className="w-full py-2.5 border border-outline-variant/30 font-label text-[8px] uppercase tracking-[0.2em] hover:bg-surface-container-low transition-colors rounded-sm"
                                  >
                                    Ajustar Valor
                                  </button>
                                </div>
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
                    Carregar Mais Presentes ({filteredGifts.length - visibleCount} descatologados)
                  </button>
                </div>
              )}
            </>
          )}
          
          {filteredGifts.length === 0 && !isLoading && (
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
            Se mesmo após ajuda com um maravilhoso presente você ainda achar que existe mais alguma forma de nos ajudar à estruturar nossos primeiros passos como família, sinta-se à vontade
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
