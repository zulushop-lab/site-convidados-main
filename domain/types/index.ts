export type RSVPGuestStatus = 'pending' | 'confirmed' | 'declined';

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

export interface TieBid {
  id: string;
  amount: number;
  guestId: string;
  familyId: string; // Desnormalizado para facilitar as agregações dos líderes (Ranking de Famílias)
  message?: string;
  createdAt: number;
  status: 'pending' | 'paid';
}
