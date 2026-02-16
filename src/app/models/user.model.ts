export interface User {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName?: string;
  city?: string;
  occupation?: string;
  phoneNumber?: string;
  avatarUrl?: string;
  points: number;
  ecoScore: number;
  totalDistanceTraveled: number;
  totalCO2Saved: number;
  createdAt: Date;
  updatedAt: Date;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  routePreference: 'eco' | 'balanced' | 'fast';
  preferredTransportModes: TransportMode[];
  notifications: {
    routeUpdates: boolean;
    pointsEarned: boolean;
    achievements: boolean;
    promotions: boolean;
  };
  privacy: {
    shareLocation: boolean;
    shareStatistics: boolean;
    publicProfile: boolean;
  };
  darkMode: boolean;
  language: string;
}

export type TransportMode = 'walk' | 'bike' | 'ebike' | 'scooter' | 'bus' | 'train' | 'tram' | 'car' | 'carpool';
