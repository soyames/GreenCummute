import { Injectable } from '@angular/core';
import { 
  getFirestore,
  Firestore, 
  doc, 
  collection,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  getDocs,
  getDoc,
  Timestamp
} from 'firebase/firestore';
import { BehaviorSubject, Observable } from 'rxjs';

export interface PointsTransaction {
  id?: string;
  uid: string;
  type: 'earn' | 'spend';
  amount: number;
  reason: string;
  routeId?: string;
  affiliateId?: string;
  timestamp: Date;
  metadata?: any;
}

export interface PointsHistory {
  totalEarned: number;
  totalSpent: number;
  balance: number;
  transactions: PointsTransaction[];
}

@Injectable({
  providedIn: 'root'
})
export class PointsService {
  private firestore: Firestore;
  private pointsBalanceSubject = new BehaviorSubject<number>(0);
  public pointsBalance$: Observable<number> = this.pointsBalanceSubject.asObservable();

  constructor() {
    this.firestore = getFirestore();
  }

  // Calculate points based on route eco-score
  calculatePointsForRoute(
    distance: number, // in km
    ecoScore: number, // 0-100
    mode: string
  ): number {
    // Base points: 10 points per km
    let points = distance * 10;

    // Bonus multiplier based on eco-score
    const ecoMultiplier = 1 + (ecoScore / 100);
    points *= ecoMultiplier;

    // Mode bonuses
    const modeBonus: { [key: string]: number } = {
      'walk': 2.0,
      'bike': 1.8,
      'e-bike': 1.5,
      'e-scooter': 1.3,
      'bus': 1.2,
      'tram': 1.2,
      'train': 1.1,
      'carpool': 0.8,
      'car': 0.3
    };

    points *= modeBonus[mode] || 1.0;

    return Math.round(points);
  }

  // Calculate and award points for completed route
  async calculateAndAwardPoints(uid: string, routeData: { route: any; completedAt: Date }): Promise<number> {
    const route = routeData.route;
    const distance = (route.distance || 0) / 1000; // Convert to km
    const ecoScore = route.ecoScore || 50;
    const mode = route.transportMode || 'walk';

    const points = this.calculatePointsForRoute(distance, ecoScore, mode);

    await this.addPoints(
      uid,
      points,
      `Completed eco-friendly route`,
      route.id,
      {
        distance,
        ecoScore,
        mode,
        co2Saved: route.co2Saved
      }
    );

    return points;
  }

  // Add points (earn)
  async addPoints(
    uid: string,
    amount: number,
    reason: string,
    routeId?: string,
    metadata?: any
  ): Promise<void> {
    const transaction: PointsTransaction = {
      uid,
      type: 'earn',
      amount,
      reason,
      routeId,
      timestamp: new Date(),
      metadata
    };

    // Add transaction to Firestore
    const transactionRef = await addDoc(
      collection(this.firestore, 'pointsTransactions'),
      transaction
    );

    // Update user's total points
    const userRef = doc(this.firestore, 'users', uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const currentPoints = userSnap.data()['points'] || 0;
      const newPoints = currentPoints + amount;
      await updateDoc(userRef, { points: newPoints });
      this.pointsBalanceSubject.next(newPoints);
    }
  }

  // Spend points
  async spendPoints(
    uid: string,
    amount: number,
    reason: string,
    affiliateId?: string,
    metadata?: any
  ): Promise<boolean> {
    // Check if user has enough points
    const currentPoints = await this.getPointsBalance(uid);
    
    if (currentPoints < amount) {
      throw new Error('Insufficient points');
    }

    const transaction: PointsTransaction = {
      uid,
      type: 'spend',
      amount,
      reason,
      affiliateId,
      timestamp: new Date(),
      metadata
    };

    // Add transaction to Firestore
    await addDoc(
      collection(this.firestore, 'pointsTransactions'),
      transaction
    );

    // Update user's total points
    const userRef = doc(this.firestore, 'users', uid);
    const newPoints = currentPoints - amount;
    await updateDoc(userRef, { points: newPoints });
    this.pointsBalanceSubject.next(newPoints);

    return true;
  }

  // Get points balance
  async getPointsBalance(uid: string): Promise<number> {
    const userRef = doc(this.firestore, 'users', uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const points = userSnap.data()['points'] || 0;
      this.pointsBalanceSubject.next(points);
      return points;
    }
    
    return 0;
  }

  // Get points history
  async getPointsHistory(uid: string, limit: number = 50): Promise<PointsHistory> {
    const transactionsQuery = query(
      collection(this.firestore, 'pointsTransactions'),
      where('uid', '==', uid),
      orderBy('timestamp', 'desc')
    );

    const querySnapshot = await getDocs(transactionsQuery);
    const transactions: PointsTransaction[] = [];
    let totalEarned = 0;
    let totalSpent = 0;

    querySnapshot.forEach((doc) => {
      const data = doc.data() as PointsTransaction;
      transactions.push({ ...data, id: doc.id });
      
      if (data.type === 'earn') {
        totalEarned += data.amount;
      } else {
        totalSpent += data.amount;
      }
    });

    return {
      totalEarned,
      totalSpent,
      balance: totalEarned - totalSpent,
      transactions: transactions.slice(0, limit)
    };
  }

  // Get recent transactions
  async getRecentTransactions(uid: string, limit: number = 10): Promise<PointsTransaction[]> {
    const transactionsQuery = query(
      collection(this.firestore, 'pointsTransactions'),
      where('uid', '==', uid),
      orderBy('timestamp', 'desc')
    );

    const querySnapshot = await getDocs(transactionsQuery);
    const transactions: PointsTransaction[] = [];

    querySnapshot.forEach((doc) => {
      transactions.push({ ...doc.data(), id: doc.id } as PointsTransaction);
    });

    return transactions.slice(0, limit);
  }

  // Award points for completing a route
  async awardPointsForRoute(uid: string, route: any): Promise<number> {
    const points = this.calculatePointsForRoute(
      route.distance / 1000, // convert meters to km
      route.ecoScore,
      route.transportMode
    );

    await this.addPoints(uid, points, `Completed eco-friendly route`, route.id, {
      distance: route.distance,
      ecoScore: route.ecoScore,
      co2Saved: route.co2Saved
    });

    return points;
  }

  // Get points (alias for getPointsBalance)
  async getPoints(uid: string): Promise<number> {
    return await this.getPointsBalance(uid);
  }

  // Get transaction history
  async getTransactionHistory(uid: string): Promise<any[]> {
    const history = await this.getPointsHistory(uid);
    return history.transactions;
  }

  // Get achievements
  async getAchievements(uid: string): Promise<any[]> {
    // Mock achievements - in real app, fetch from Firestore
    return [
      {
        id: '1',
        name: 'First Journey',
        description: 'Complete your first eco-friendly route',
        icon: 'trail-sign',
        points: 50,
        requirement: { type: 'routes', value: 1 },
        progress: 0,
        unlocked: false
      },
      {
        id: '2',
        name: 'Eco Warrior',
        description: 'Save 10kg of CO2',
        icon: 'leaf',
        points: 100,
        requirement: { type: 'co2saved', value: 10000 },
        progress: 0,
        unlocked: false
      },
      {
        id: '3',
        name: 'Distance Champion',
        description: 'Travel 100km by eco-friendly transport',
        icon: 'speedometer',
        points: 200,
        requirement: { type: 'distance', value: 100000 },
        progress: 0,
        unlocked: false
      }
    ];
  }

  // Get leaderboard
  async getLeaderboard(limit: number = 50, timeframe: string = 'week'): Promise<any[]> {
    // Mock leaderboard - in real app, aggregate from Firestore
    return [
      {
        userId: 'user1',
        displayName: 'Eco Champion',
        avatarUrl: '',
        points: 1250,
        ecoScore: 95,
        rank: 1,
        totalCO2Saved: 45000,
        totalDistance: 125000
      },
      {
        userId: 'user2',
        displayName: 'Green Traveler',
        avatarUrl: '',
        points: 980,
        ecoScore: 88,
        rank: 2,
        totalCO2Saved: 38000,
        totalDistance: 95000
      }
    ];
  }

  // Get user stats
  async getUserStats(uid: string): Promise<any> {
    const history = await this.getPointsHistory(uid);
    const achievements = await this.getAchievements(uid);

    return {
      totalPoints: history.balance,
      totalRoutes: history.transactions.filter(t => t.type === 'earn' && t.routeId).length,
      totalDistance: 0, // Calculate from routes
      totalCO2Saved: 0, // Calculate from routes
      averageEcoScore: 85,
      achievements: achievements,
      currentStreak: 0,
      longestStreak: 0,
      transportModeBreakdown: []
    };
  }
}
