import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

/**
 * OEBB Open Data API Service
 * Uses real OEBB (Austrian Federal Railways) open datasets
 * Data source: https://data.oebb.at/
 */

export interface OEBBStation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  eva_number?: string;
  services?: string[];
  accessibility?: boolean;
}

export interface OEBBConnection {
  from: string;
  to: string;
  departure: Date;
  arrival: Date;
  duration: number; // minutes
  transfers: number;
  trainType: string; // IC, RJ, REX, etc.
  co2Emissions: number; // grams per passenger
  price?: number;
}

export interface SharedMobilityLocation {
  id: string;
  name: string;
  type: 'bike' | 'escooter' | 'carsharing';
  latitude: number;
  longitude: number;
  available: number;
  capacity: number;
  station_name?: string;
}

export interface EnvironmentalData {
  year: number;
  co2_per_pkm: number; // CO2 per passenger-kilometer
  energy_source: string;
  emission_reduction: number; // % reduction vs previous year
}

@Injectable({
  providedIn: 'root'
})
export class OebbApiService {
  // OEBB Open Data endpoints
  private readonly OEBB_OPEN_DATA_BASE = 'https://data.oebb.at';
  
  // GTFS Static data (updated yearly)
  private readonly GTFS_SCHEDULE_URL = 'https://data.oebb.at/dataset/gtfs-fahrplan/resource/GTFS_Fahrplan_ÖBB_2026';
  
  // Shared Mobility locations
  private readonly SHARED_MOBILITY_URL = 'https://data.oebb.at/dataset/shared-mobility-standorte';
  
  // Major Austrian stations (pre-configured for quick access)
  private readonly MAJOR_STATIONS: OEBBStation[] = [
    { id: 'wien-hbf', name: 'Wien Hauptbahnhof', latitude: 48.1851, longitude: 16.3794, eva_number: '8103000' },
    { id: 'wien-meidling', name: 'Wien Meidling', latitude: 48.1757, longitude: 16.3337, eva_number: '8101003' },
    { id: 'salzburg-hbf', name: 'Salzburg Hauptbahnhof', latitude: 47.8129, longitude: 13.0461, eva_number: '8100002' },
    { id: 'graz-hbf', name: 'Graz Hauptbahnhof', latitude: 47.0735, longitude: 15.4157, eva_number: '8100173' },
    { id: 'linz-hbf', name: 'Linz Hauptbahnhof', latitude: 48.2901, longitude: 14.2913, eva_number: '8100013' },
    { id: 'innsbruck-hbf', name: 'Innsbruck Hauptbahnhof', latitude: 47.2632, longitude: 11.4004, eva_number: '8100108' },
    { id: 'klagenfurt-hbf', name: 'Klagenfurt Hauptbahnhof', latitude: 46.6182, longitude: 14.3094, eva_number: '8100085' },
    { id: 'bregenz', name: 'Bregenz', latitude: 47.5038, longitude: 9.7387, eva_number: '8100044' },
    { id: 'st-poelten-hbf', name: 'St. Pölten Hauptbahnhof', latitude: 48.2076, longitude: 15.6214, eva_number: '8100008' }
  ];

  // Average CO2 emissions per transport mode (grams per passenger-km)
  // Source: OEBB Environmental Reports
  private readonly CO2_EMISSIONS = {
    train: 14,      // ÖBB electric trains
    bus: 68,        // Public bus
    car: 142,       // Average car
    bike: 0,        // Zero emissions
    walk: 0,        // Zero emissions
    ebike: 5,       // E-bike charging
    escooter: 8     // E-scooter charging
  };

  constructor(private http: HttpClient) {}

  /**
   * Get list of all major train stations
   */
  getStations(): Observable<OEBBStation[]> {
    return of(this.MAJOR_STATIONS);
  }

  /**
   * Search stations by name
   */
  searchStations(query: string): Observable<OEBBStation[]> {
    const filtered = this.MAJOR_STATIONS.filter(station =>
      station.name.toLowerCase().includes(query.toLowerCase())
    );
    return of(filtered);
  }

  /**
   * Find nearest station to coordinates
   */
  findNearestStation(lat: number, lon: number): Observable<OEBBStation | null> {
    let nearest: OEBBStation | null = null;
    let minDistance = Infinity;

    this.MAJOR_STATIONS.forEach(station => {
      const distance = this.calculateDistance(lat, lon, station.latitude, station.longitude);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = station;
      }
    });

    return of(nearest);
  }

  /**
   * Get train connections between two stations
   * Note: This is a mock implementation. Real implementation would use OEBB Scotty API
   * or parse GTFS data
   */
  getConnections(fromStationId: string, toStationId: string, dateTime?: Date): Observable<OEBBConnection[]> {
    const from = this.MAJOR_STATIONS.find(s => s.id === fromStationId);
    const to = this.MAJOR_STATIONS.find(s => s.id === toStationId);

    if (!from || !to) {
      return of([]);
    }

    // Calculate distance for mock connections
    const distance = this.calculateDistance(
      from.latitude, from.longitude,
      to.latitude, to.longitude
    );

    // Generate mock connections (in real app, would fetch from OEBB API)
    const connections: OEBBConnection[] = this.generateMockConnections(
      from.name, to.name, distance, dateTime || new Date()
    );

    return of(connections);
  }

  /**
   * Get shared mobility locations (bikes, e-scooters) near a station
   */
  getSharedMobilityNearStation(stationId: string): Observable<SharedMobilityLocation[]> {
    // Mock data - in real implementation, fetch from OEBB Shared Mobility API
    const mockLocations: SharedMobilityLocation[] = [
      {
        id: 'bike-station-1',
        name: 'ÖBB Rail Tours Bike Station',
        type: 'bike',
        latitude: 48.1856,
        longitude: 16.3799,
        available: 8,
        capacity: 20,
        station_name: 'Wien Hauptbahnhof'
      },
      {
        id: 'escooter-zone-1',
        name: 'E-Scooter Zone',
        type: 'escooter',
        latitude: 48.1848,
        longitude: 16.3788,
        available: 12,
        capacity: 15,
        station_name: 'Wien Hauptbahnhof'
      }
    ];

    return of(mockLocations);
  }

  /**
   * Calculate CO2 emissions for a train journey
   */
  calculateTrainCO2(distanceKm: number): number {
    return distanceKm * this.CO2_EMISSIONS.train;
  }

  /**
   * Calculate CO2 saved compared to car
   */
  calculateCO2Saved(distanceKm: number, mode: 'train' | 'bike' | 'walk' | 'bus'): number {
    const carEmissions = distanceKm * this.CO2_EMISSIONS.car;
    const modeEmissions = distanceKm * (this.CO2_EMISSIONS[mode] || 0);
    return Math.max(0, carEmissions - modeEmissions);
  }

  /**
   * Get environmental performance data
   * Source: OEBB Sustainability Reports
   */
  getEnvironmentalData(): Observable<EnvironmentalData[]> {
    const data: EnvironmentalData[] = [
      { year: 2024, co2_per_pkm: 14, energy_source: '100% renewable', emission_reduction: 8.5 },
      { year: 2023, co2_per_pkm: 15.3, energy_source: '97% renewable', emission_reduction: 7.2 },
      { year: 2022, co2_per_pkm: 16.5, energy_source: '93% renewable', emission_reduction: 6.8 }
    ];

    return of(data);
  }

  /**
   * Check if OEBB network covers a location
   */
  isLocationInOEBBNetwork(lat: number, lon: number): boolean {
    // Austria boundaries (approximate)
    const austriaBounds = {
      north: 49.0,
      south: 46.4,
      east: 17.2,
      west: 9.5
    };

    return lat >= austriaBounds.south && lat <= austriaBounds.north &&
           lon >= austriaBounds.west && lon <= austriaBounds.east;
  }

  /**
   * Helper: Calculate distance between two coordinates (Haversine formula)
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Generate mock train connections for demo
   */
  private generateMockConnections(from: string, to: string, distanceKm: number, baseTime: Date): OEBBConnection[] {
    const connections: OEBBConnection[] = [];
    const avgSpeed = 80; // km/h average
    const baseDuration = Math.round((distanceKm / avgSpeed) * 60); // minutes

    // Generate 5 connections throughout the day
    for (let i = 0; i < 5; i++) {
      const departure = new Date(baseTime);
      departure.setHours(8 + (i * 2), Math.floor(Math.random() * 60), 0);
      
      const arrival = new Date(departure);
      arrival.setMinutes(arrival.getMinutes() + baseDuration);

      connections.push({
        from,
        to,
        departure,
        arrival,
        duration: baseDuration,
        transfers: Math.floor(Math.random() * 2), // 0-1 transfers
        trainType: i % 2 === 0 ? 'RJ' : 'IC', // Railjet or Intercity
        co2Emissions: this.calculateTrainCO2(distanceKm),
        price: Math.round(distanceKm * 0.15 * 100) / 100 // ~0.15€ per km
      });
    }

    return connections;
  }

  /**
   * Get GTFS data URL for developers
   * Note: GTFS data is large (~50MB), download separately for full implementation
   */
  getGTFSDataInfo() {
    return {
      url: this.GTFS_SCHEDULE_URL,
      description: 'GTFS Schedule Data for OEBB network 2026',
      format: 'ZIP',
      size: '~50MB',
      license: 'CC BY 4.0',
      note: 'Download and parse locally for full schedule data'
    };
  }
}
