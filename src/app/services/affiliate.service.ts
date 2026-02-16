import { Injectable } from '@angular/core';
import { 
  getFirestore,
  Firestore, 
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  updateDoc
} from 'firebase/firestore';

export interface AffiliatePartner {
  id: string;
  name: string;
  logo: string;
  description: string;
  category: string; // 'food', 'retail', 'entertainment', 'services', etc.
  offers: AffiliateOffer[];
  active: boolean;
}

export interface AffiliateOffer {
  id: string;
  partnerId: string;
  partnerName: string;
  title: string;
  description: string;
  pointsCost: number;
  value: string; // e.g., "€10 off", "20% discount"
  type: 'discount' | 'voucher' | 'certificate';
  terms: string;
  expiryDays: number; // how many days the voucher is valid
  stock?: number; // limited quantity
  active: boolean;
  imageUrl?: string;
}

export interface Redemption {
  id?: string;
  uid: string;
  offerId: string;
  offerTitle: string;
  partnerId: string;
  partnerName: string;
  pointsSpent: number;
  code: string; // unique redemption code
  status: 'active' | 'used' | 'expired';
  redeemedAt: Date;
  usedAt?: Date;
  expiresAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class AffiliateService {
  private firestore: Firestore;

  constructor() {
    this.firestore = getFirestore();
  }

  // Get all active partners
  async getPartners(): Promise<AffiliatePartner[]> {
    const partnersQuery = query(
      collection(this.firestore, 'affiliatePartners'),
      where('active', '==', true),
      orderBy('name')
    );

    const querySnapshot = await getDocs(partnersQuery);
    const partners: AffiliatePartner[] = [];

    querySnapshot.forEach((doc) => {
      const data: any = doc.data();
      partners.push({ ...data, id: doc.id } as AffiliatePartner);
    });

    return partners;
  }

  // Get partner by ID
  async getPartner(partnerId: string): Promise<AffiliatePartner | null> {
    const partnerRef = doc(this.firestore, 'affiliatePartners', partnerId);
    const partnerSnap = await getDoc(partnerRef);

    if (partnerSnap.exists()) {
      return { ...(partnerSnap.data() as any), id: partnerSnap.id } as AffiliatePartner;
    }

    return null;
  }

  // Get all active offers
  async getOffers(category?: string): Promise<AffiliateOffer[]> {
    let offersQuery;

    if (category) {
      offersQuery = query(
        collection(this.firestore, 'affiliateOffers'),
        where('active', '==', true),
        where('category', '==', category),
        orderBy('pointsCost')
      );
    } else {
      offersQuery = query(
        collection(this.firestore, 'affiliateOffers'),
        where('active', '==', true),
        orderBy('pointsCost')
      );
    }

    const querySnapshot = await getDocs(offersQuery);
    const offers: AffiliateOffer[] = [];

    querySnapshot.forEach((doc) => {
      offers.push({ ...(doc.data() as any), id: doc.id } as AffiliateOffer);
    });

    return offers;
  }

  // Get offers by partner
  async getOffersByPartner(partnerId: string): Promise<AffiliateOffer[]> {
    const offersQuery = query(
      collection(this.firestore, 'affiliateOffers'),
      where('partnerId', '==', partnerId),
      where('active', '==', true),
      orderBy('pointsCost')
    );

    const querySnapshot = await getDocs(offersQuery);
    const offers: AffiliateOffer[] = [];

    querySnapshot.forEach((doc) => {
      offers.push({ ...(doc.data() as any), id: doc.id } as AffiliateOffer);
    });

    return offers;
  }

  // Redeem an offer
  async redeemOffer(
    uid: string,
    offer: AffiliateOffer
  ): Promise<Redemption> {
    // Generate unique redemption code
    const code = this.generateRedemptionCode();

    // Calculate expiry date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + offer.expiryDays);

    const redemption: Redemption = {
      uid,
      offerId: offer.id,
      offerTitle: offer.title,
      partnerId: offer.partnerId,
      partnerName: offer.partnerName,
      pointsSpent: offer.pointsCost,
      code,
      status: 'active',
      redeemedAt: new Date(),
      expiresAt
    };

    // Add to Firestore
    const redemptionRef = await addDoc(
      collection(this.firestore, 'redemptions'),
      redemption
    );

    // Update stock if limited
    if (offer.stock !== undefined && offer.stock > 0) {
      const offerRef = doc(this.firestore, 'affiliateOffers', offer.id);
      await updateDoc(offerRef, {
        stock: offer.stock - 1
      });
    }

    return { ...redemption, id: redemptionRef.id };
  }

  // Get user's redemptions
  async getUserRedemptions(uid: string): Promise<Redemption[]> {
    const redemptionsQuery = query(
      collection(this.firestore, 'redemptions'),
      where('uid', '==', uid),
      orderBy('redeemedAt', 'desc')
    );

    const querySnapshot = await getDocs(redemptionsQuery);
    const redemptions: Redemption[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data() as Redemption;
      
      // Check if expired
      const now = new Date();
      const expiresAt = data.expiresAt instanceof Date ? data.expiresAt : new Date(data.expiresAt);
      
      if (data.status === 'active' && expiresAt < now) {
        data.status = 'expired';
      }

      redemptions.push({ ...data, id: doc.id });
    });

    return redemptions;
  }

  // Mark redemption as used
  async markRedemptionUsed(redemptionId: string): Promise<void> {
    const redemptionRef = doc(this.firestore, 'redemptions', redemptionId);
    await updateDoc(redemptionRef, {
      status: 'used',
      usedAt: new Date()
    });
  }

  // Generate unique redemption code
  private generateRedemptionCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    
    for (let i = 0; i < 12; i++) {
      if (i > 0 && i % 4 === 0) code += '-';
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return code;
  }

  // Get redemption by code
  async getRedemptionByCode(code: string): Promise<Redemption | null> {
    const redemptionsQuery = query(
      collection(this.firestore, 'redemptions'),
      where('code', '==', code)
    );

    const querySnapshot = await getDocs(redemptionsQuery);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { ...(doc.data() as any), id: doc.id } as Redemption;
    }

    return null;
  }
}
