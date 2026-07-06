import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
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
  Timestamp,
  deleteDoc
} from 'firebase/firestore';

export interface Location {
  lat: number;
  lng: number;
  address?: string;
}

export interface Route {
  id: string;
  origin: Location;
  destination: Location;
  distance: number; // in km
  duration: number; // in minutes
  ecoScore: number; // 0-100, where 100 is most eco-friendly
  co2Emissions: number; // in kg
  co2Saved: number; // compared to car
  modes: RouteSegment[];
  points: number;
  createdAt: Date;
  transportMode: string;
  coordinates?: {lat: number, lng: number}[];
}

export interface RouteSegment {
  mode: string; // 'walk', 'bike', 'bus', 'train', 'tram', etc.
  from: Location;
  to: Location;
  distance: number;
  duration: number;
  instructions?: string;
  line?: string; // for public transit
  departure?: Date;
  arrival?: Date;
  polyline?: string; // encoded polyline for map display
}

@Injectable({
  providedIn: 'root'
})
export class RouteService {
  private firestore: Firestore;
  
  private readonly CO2_PER_KM = {
    car: 0.192, // kg CO2 per km
    bus: 0.089,
    train: 0.041,
    tram: 0.038,
    'e-bike': 0.022,
    'e-scooter': 0.025,
    bike: 0,
    walk: 0
  };

  private readonly OSRM_PROFILES: Record<string, string> = {
    walk: 'walking',
    bike: 'cycling',
    ebike: 'cycling',
    scooter: 'cycling',
    car: 'driving',
    bus: 'driving',
    train: 'driving'
  };

  constructor() {
    this.firestore = getFirestore();
  }

  // Calculate route with real OSRM data
  async calculateRoutes(
    origin: Location,
    destination: Location,
    preferences: {
      ecoBalance: number; // 0-100
      modes: string[];
      maxWalkDistance?: number;
    }
  ): Promise<Route[]> {
    const routes: Route[] = [];
    
    for (const mode of preferences.modes) {
      const osrmProfile = this.OSRM_PROFILES[mode] || 'driving';
      
      try {
        const url = `https://router.project-osrm.org/route/v1/${osrmProfile}/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;
        
        const response = await fetch(url);
        const data: any = await response.json();
        
        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
          const routeData = data.routes[0];
          
          const distanceKm = routeData.distance / 1000;
          const durationMins = routeData.duration / 60;
          
          // Calculate Eco Score based on mode
          let ecoScore = 50;
          if (mode === 'walk' || mode === 'bike') ecoScore = 100;
          else if (mode === 'ebike' || mode === 'scooter') ecoScore = 90;
          else if (mode === 'bus' || mode === 'train') ecoScore = 80;
          else if (mode === 'car') ecoScore = 20;

          const co2Emissions = this.calculateCO2(distanceKm, mode);
          const carEmissions = this.calculateCO2(distanceKm, 'car');
          const co2Saved = Math.max(0, carEmissions - co2Emissions);

          // Convert GeoJSON coords to LatLng array
          const coordinates = routeData.geometry.coordinates.map((coord: number[]) => ({
            lat: coord[1],
            lng: coord[0]
          }));

          routes.push({
            id: this.generateRouteId(),
            origin,
            destination,
            distance: distanceKm * 1000, // keep as meters for format methods
            duration: durationMins * 60, // keep as seconds
            ecoScore,
            co2Emissions,
            co2Saved: Number(co2Saved.toFixed(2)),
            transportMode: mode,
            modes: [{
              mode,
              from: origin,
              to: destination,
              distance: distanceKm * 1000,
              duration: durationMins * 60
            }],
            coordinates,
            points: Math.round(co2Saved * 10), // Example points calculation
            createdAt: new Date()
          });
        }
      } catch (err) {
        console.error(`Failed to fetch route for mode ${mode}`, err);
      }
    }

    // Sort by eco-balance preference
    return this.sortRoutesByPreference(routes, preferences.ecoBalance);
  }

  // Calculate distance between two points (Haversine formula)
  private calculateDistance(from: Location, to: Location): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.deg2rad(to.lat - from.lat);
    const dLng = this.deg2rad(to.lng - from.lng);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(from.lat)) * Math.cos(this.deg2rad(to.lat)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return Math.round(distance * 100) / 100;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  // Calculate CO2 emissions
  private calculateCO2(distance: number, mode: string): number {
    const emission = this.CO2_PER_KM[mode as keyof typeof this.CO2_PER_KM] || 0.1;
    return distance * emission;
  }

  // Generate route segments
  private generateSegments(
    origin: Location,
    destination: Location,
    modes: string[],
    totalDistance: number
  ): RouteSegment[] {
    const segments: RouteSegment[] = [];
    const segmentDistance = totalDistance / modes.length;

    for (let i = 0; i < modes.length; i++) {
      const isLast = i === modes.length - 1;
      segments.push({
        mode: modes[i],
        from: i === 0 ? origin : segments[i - 1].to,
        to: isLast ? destination : {
          lat: origin.lat + ((destination.lat - origin.lat) * (i + 1) / modes.length),
          lng: origin.lng + ((destination.lng - origin.lng) * (i + 1) / modes.length)
        },
        distance: segmentDistance,
        duration: segmentDistance * 10 // rough estimate
      });
    }

    return segments;
  }

  // Sort routes by user preference (eco vs speed)
  private sortRoutesByPreference(routes: Route[], ecoBalance: number): Route[] {
    return routes.sort((a, b) => {
      // Score combines eco-score and duration
      const scoreA = (a.ecoScore * ecoBalance / 100) + ((1 / a.duration) * (100 - ecoBalance));
      const scoreB = (b.ecoScore * ecoBalance / 100) + ((1 / b.duration) * (100 - ecoBalance));
      return scoreB - scoreA;
    });
  }

  // Generate unique route ID
  private generateRouteId(): string {
    return `route_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Save route for later use
  async saveRoute(route: Route, uid: string): Promise<string> {
    // This would save to Firestore
    // For now, we'll return the route ID
    return route.id;
  }

  // Get saved routes
  async getSavedRoutes(uid: string): Promise<Route[]> {
    // This would fetch from Firestore
    return [];
  }

  // Save completed route to history
  async saveToHistory(route: any, uid: string): Promise<void> {
    try {
      // In a real app, save to Firestore
      console.log('Route saved to history:', route.id);
    } catch (error) {
      console.error('Error saving route to history:', error);
      throw error;
    }
  }

  // Get route history for user
  async getRouteHistory(uid: string, limit: number = 20): Promise<any[]> {
    try {
      // In a real app, fetch from Firestore
      return [];
    } catch (error) {
      console.error('Error getting route history:', error);
      return [];
    }
  }
}
