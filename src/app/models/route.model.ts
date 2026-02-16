import { TransportMode } from './user.model';

export interface Route {
  id: string;
  userId: string;
  origin: Location;
  destination: Location;
  waypoints?: Location[];
  transportMode: TransportMode;
  distance: number;
  duration: number;
  ecoScore: number;
  co2Emissions: number;
  co2Saved: number;
  pointsEarned: number;
  polyline: string;
  steps: RouteStep[];
  startTime?: Date;
  endTime?: Date;
  completed: boolean;
  favorite: boolean;
  createdAt: Date;
}

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
  name?: string;
}

export interface RouteStep {
  instruction: string;
  distance: number;
  duration: number;
  transportMode: TransportMode;
  polyline?: string;
}

export interface RouteOptions {
  origin: Location;
  destination: Location;
  transportModes: TransportMode[];
  optimizeFor: 'eco' | 'time' | 'balanced';
  avoidHighways?: boolean;
  avoidTolls?: boolean;
}

export interface RouteComparison {
  routes: Route[];
  recommendations: {
    mostEco: Route;
    fastest: Route;
    balanced: Route;
  };
}
