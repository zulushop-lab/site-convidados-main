export type RSVPGuestStatus = 'pending' | 'confirmed' | 'declined';
export type ContributionStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type ContributionPaymentMethod = 'pix' | 'credit_card' | 'mercadopago';
export type GiftCategory = 'Primeiros Passos' | 'Lua de Mel' | 'Casa';

export interface GiftCatalogItem {
  id: string;
  title: string;
  description: string;
  category: GiftCategory;
  imageSrc: string;
  suggestedAmount: number;
  minimumContribution: number;
  referenceTotal: number;
  quotaCount: number;
  order: number;
  priceSourceUrl?: string;
  imageSourceUrl?: string;
  priceCheckedAt?: string;
}

export interface Family {
  id: string;
  name: string;
  code: string; // Codigo unico utilizado para acesso via URL (vinda do PDF).
  phone?: string;
}

export interface Guest {
  id: string;
  familyId: string;
  name: string;
  isChild?: boolean;
  phone?: string;
  email?: string;
  rsvpStatus?: RSVPGuestStatus;
  isMainGuest?: boolean; // Define se este usuario pode fazer o RSVP pela familia inteira.
}

export interface Gift {
  id: string;
  title: string;
  description: string;
  category: GiftCategory;
  price: number; // Public suggested contribution amount in BRL.
  imageUrl: string;
  isBought?: boolean;
}

export interface Contribution {
  id: string;
  amount: number; // BRL decimal, ex. 150.00. Client creates only pending records.
  giftTitle: string;
  donorName: string;
  donorEmail: string;
  paymentMethod: ContributionPaymentMethod;
  status: ContributionStatus;
  createdAt: number;
}

export type TieBidStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface TieBid {
  id: string;
  amount: number; // BRL decimal, ex. 150.00 (mesma unidade de Contribution). > 0.
  guestId?: string; // Opcional ate SPEC-RSVP-AUTH carimbar identidade.
  familyId?: string; // Opcional; ranking por familia so conta quando presente. Desnormalizado p/ agregacoes (ADR-0004).
  familyName?: string;
  donorName?: string;
  donorEmail?: string;
  displayName?: string;
  message?: string; // Ate 500 chars.
  createdAt: number;
  status: TieBidStatus; // Cliente cria apenas 'pending'; promocao e exclusiva do servidor.
  aggregatedAt?: number;
  aggregationVersion?: number;
}

export interface TieLeaderboardEntry {
  id: string;
  name: string;
  total: number;
  bidCount: number;
  lastCompletedAt: number;
}

export interface TieLeaderboardDocument {
  entries: TieLeaderboardEntry[];
  updatedAt?: number;
}
