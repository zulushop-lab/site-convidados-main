export type RSVPGuestStatus = 'pending' | 'confirmed' | 'declined';
export type ContributionStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type ContributionPaymentMethod = 'pix' | 'credit_card';
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
}

export interface Guest {
  id: string;
  familyId: string;
  name: string;
  phone?: string;
  email?: string;
  rsvpStatus: RSVPGuestStatus;
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

export interface TieBid {
  id: string;
  amount: number;
  guestId: string;
  familyId: string; // Desnormalizado para facilitar as agregacoes dos lideres (Ranking de Familias).
  message?: string;
  createdAt: number;
  status: 'pending' | 'paid';
}
