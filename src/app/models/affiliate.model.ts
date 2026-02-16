export interface AffiliatePartner {
  id: string;
  name: string;
  description: string;
  logo: string;
  category: 'retail' | 'food' | 'transport' | 'entertainment' | 'health' | 'education';
  website?: string;
  locations?: PartnerLocation[];
  offers: Offer[];
  active: boolean;
}

export interface PartnerLocation {
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  phone?: string;
  hours?: string;
}

export interface Offer {
  id: string;
  partnerId: string;
  title: string;
  description: string;
  pointsCost: number;
  discountType: 'percentage' | 'fixed' | 'freeItem';
  discountValue: number;
  terms?: string;
  validFrom: Date;
  validUntil: Date;
  maxRedemptions?: number;
  remainingRedemptions?: number;
  active: boolean;
}

export interface Redemption {
  id: string;
  userId: string;
  offerId: string;
  partnerId: string;
  pointsSpent: number;
  code: string;
  status: 'active' | 'used' | 'expired';
  redeemedAt: Date;
  usedAt?: Date;
  expiresAt: Date;
}
