export type RSVPGuestStatus = 'pending' | 'confirmed' | 'declined';
export type ContributionStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type ContributionPaymentMethod = 'pix' | 'credit_card';

export interface Family {
  id: string;
  name: string;
  code: string; // O código único utilizado para acesso via URL (vinda do PDF)
}

export interface Guest {
  id: string;
  familyId: string;
  name: string;
  phone?: string;
  email?: string;
  rsvpStatus: RSVPGuestStatus;
  isMainGuest?: boolean; // Define se este usuário pode fazer o RSVP pela família inteira
}

export interface Gift {
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrl: string;
  purchased: boolean;
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
  familyId: string; // Desnormalizado para facilitar as agregações dos líderes (Ranking de Famílias)
  message?: string;
  createdAt: number;
  status: 'pending' | 'paid';
}
