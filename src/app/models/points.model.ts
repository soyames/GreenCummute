export interface PointsTransaction {
  id: string;
  userId: string;
  type: 'earn' | 'spend' | 'bonus' | 'achievement';
  amount: number;
  description: string;
  routeId?: string;
  affiliateId?: string;
  createdAt: Date;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  requirement: {
    type: 'distance' | 'routes' | 'co2saved' | 'streak' | 'transport';
    value: number;
    transportMode?: string;
  };
  progress?: number;
  unlocked: boolean;
  unlockedAt?: Date;
}

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  points: number;
  ecoScore: number;
  rank: number;
  totalCO2Saved: number;
  totalDistance: number;
}

export interface UserStats {
  totalPoints: number;
  totalRoutes: number;
  totalDistance: number;
  totalCO2Saved: number;
  averageEcoScore: number;
  achievements: Achievement[];
  currentStreak: number;
  longestStreak: number;
  transportModeBreakdown: {
    mode: string;
    count: number;
    distance: number;
  }[];
}
