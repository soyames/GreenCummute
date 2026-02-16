import { Injectable } from '@angular/core';
import { Geolocation, Position } from '@capacitor/geolocation';
import { BehaviorSubject, Observable } from 'rxjs';
import * as L from 'leaflet';

// Extend Window interface to include Capacitor
declare global {
  interface Window {
    Capacitor?: {
      getPlatform: () => string;
      isNativePlatform: () => boolean;
    };
  }
}

export interface MapLocation {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp?: number;
}

export interface MarkerOptions {
  title?: string;
  color?: string;
  popup?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MapService {
  private currentLocationSubject = new BehaviorSubject<MapLocation | null>(null);
  public currentLocation$: Observable<MapLocation | null> = this.currentLocationSubject.asObservable();

  private watchId: string | number | null = null; // Can be string (Capacitor) or number (browser)
  private maps: Map<string, L.Map> = new Map();
  private markers: Map<string, L.Marker[]> = new Map();
  private routes: Map<string, L.Polyline[]> = new Map();

  constructor() {}

  // Get current position once
  async getCurrentLocation(): Promise<MapLocation> {
    try {
      console.log('Requesting location permission...');
      
      // Check if we're on web (browser) - Capacitor Geolocation doesn't work on web
      const isWeb = !window.Capacitor || window.Capacitor.getPlatform() === 'web';
      
      if (isWeb) {
        // Use browser's native geolocation API
        console.log('Using browser geolocation API (web platform)');
        return await this.getBrowserLocation();
      }
      
      // Use Capacitor for native apps (iOS/Android)
      console.log('Using Capacitor geolocation (native platform)');
      const permission = await Geolocation.checkPermissions();
      console.log('Current permission status:', permission);
      
      if (permission.location !== 'granted') {
        console.log('Requesting permission...');
        const request = await Geolocation.requestPermissions();
        console.log('Permission request result:', request);
        
        if (request.location !== 'granted') {
          throw new Error('Location permission denied. Please enable location access in your device settings.');
        }
      }

      console.log('Getting position...');
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000
      });

      console.log('Position received:', position);

      if (!position?.coords?.latitude || !position?.coords?.longitude) {
        throw new Error('Invalid position data received from GPS');
      }

      const location: MapLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp
      };

      this.currentLocationSubject.next(location);
      return location;
    } catch (error: any) {
      console.error('Location error:', error);
      throw new Error(`Failed to get location: ${error.message || 'Unknown error'}`);
    }
  }

  // Browser geolocation fallback for web
  private async getBrowserLocation(): Promise<MapLocation> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      console.log('Requesting browser geolocation...');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('Browser position received:', position);
          const location: MapLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
          };
          this.currentLocationSubject.next(location);
          resolve(location);
        },
        (error) => {
          console.error('Browser geolocation error:', error);
          let errorMessage = 'Could not get your location';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location permission denied. Please enable location access in your browser settings.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable. Please check your GPS/Wi-Fi.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out. Please try again.';
              break;
          }
          
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 5000
        }
      );
    });
  }

  // Start watching position (for navigation)
  async startWatchingLocation(callback?: (location: MapLocation) => void): Promise<void> {
    try {
      // Check if we're on web
      const isWeb = !window.Capacitor || window.Capacitor.getPlatform() === 'web';
      
      if (isWeb) {
        // Use browser's watchPosition API
        console.log('Starting browser geolocation watch...');
        
        if (!navigator.geolocation) {
          throw new Error('Geolocation is not supported by your browser');
        }

        this.watchId = navigator.geolocation.watchPosition(
          (position) => {
            const location: MapLocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: position.timestamp
            };
            this.currentLocationSubject.next(location);
            if (callback) callback(location);
            console.log('Location updated:', location);
          },
          (error) => {
            console.error('Watch location error:', error);
          },
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 5000
          }
        ) as any; // Store as any since it's a number on web
        
        console.log('Browser location watch started');
        return;
      }

      // Native app path - use Capacitor
      console.log('Starting Capacitor location watch...');
      const permission = await Geolocation.checkPermissions();
      
      if (permission.location !== 'granted') {
        const request = await Geolocation.requestPermissions();
        if (request.location !== 'granted') {
          throw new Error('Location permission denied');
        }
      }

      this.watchId = await Geolocation.watchPosition(
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        },
        (position: Position | null, err?: any) => {
          if (err) {
            console.error('Watch position error:', err);
            return;
          }

          if (position) {
            const location: MapLocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: position.timestamp
            };

            this.currentLocationSubject.next(location);
            
            if (callback) {
              callback(location);
            }
          }
        }
      );
      console.log('Capacitor location watch started');
    } catch (error: any) {
      console.error('Start watching error:', error);
      throw new Error(`Failed to watch location: ${error.message || 'Unknown error'}`);
    }
  }

  // Stop watching position
  async stopWatchingLocation(): Promise<void> {
    if (this.watchId !== null) {
      // Check if we're on web
      const isWeb = !window.Capacitor || window.Capacitor.getPlatform() === 'web';
      
      if (isWeb) {
        // Use browser's clearWatch
        navigator.geolocation.clearWatch(this.watchId as number);
        console.log('Browser location watch stopped');
      } else {
        // Use Capacitor's clearWatch
        await Geolocation.clearWatch({ id: this.watchId as string });
        console.log('Capacitor location watch stopped');
      }
      
      this.watchId = null;
    }
  }

  // Reverse geocode using Nominatim (lat/lng to address)
  async reverseGeocode(lat: number, lng: number): Promise<string> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'GreenCommute App'
          }
        }
      );
      const data = await response.json();
      
      if (data && data.display_name) {
        return data.display_name;
      }
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  }

  // Forward geocode using Nominatim (address to lat/lng)
  async geocode(address: string): Promise<MapLocation> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
        {
          headers: {
            'User-Agent': 'GreenCommute App'
          }
        }
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        };
      }
      throw new Error('Address not found');
    } catch (error) {
      console.error('Geocoding error:', error);
      throw new Error(`Could not find address: ${address}`);
    }
  }

  // Calculate route polyline
  encodePolyline(points: MapLocation[]): string {
    // Implementation of polyline encoding algorithm
    // This is a simplified version
    let encoded = '';
    let prevLat = 0;
    let prevLng = 0;

    for (const point of points) {
      const lat = Math.round(point.lat * 1e5);
      const lng = Math.round(point.lng * 1e5);
      
      encoded += this.encodeValue(lat - prevLat);
      encoded += this.encodeValue(lng - prevLng);
      
      prevLat = lat;
      prevLng = lng;
    }

    return encoded;
  }

  private encodeValue(value: number): string {
    let encoded = '';
    value = value < 0 ? ~(value << 1) : value << 1;
    
    while (value >= 0x20) {
      encoded += String.fromCharCode((0x20 | (value & 0x1f)) + 63);
      value >>= 5;
    }
    
    encoded += String.fromCharCode(value + 63);
    return encoded;
  }

  // Decode polyline
  decodePolyline(encoded: string): MapLocation[] {
    const points: MapLocation[] = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < encoded.length) {
      let b: number;
      let shift = 0;
      let result = 0;

      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
      lat += dlat;

      shift = 0;
      result = 0;

      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
      lng += dlng;

      points.push({
        lat: lat / 1e5,
        lng: lng / 1e5
      });
    }

    return points;
  }

  // Leaflet map instance storage
  private mapInstances = new Map<string, any>();
  private routeLayers = new Map<string, any[]>();
  private markerLayers = new Map<string, any[]>();

  // Create and initialize Leaflet map
  async createMap(containerId: string, options?: { center?: [number, number], zoom?: number }): Promise<L.Map> {
    const center = options?.center || [48.2082, 16.3738];
    const zoom = options?.zoom || 13;

    // Fix Leaflet icon paths
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    const map = L.map(containerId).setView(center, zoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    // Store in maps collection
    this.maps.set(containerId, map);
    this.markers.set(containerId, []);
    this.routes.set(containerId, []);

    return map;
  }

  // Initialize map (for Leaflet integration)
  initializeMap(mapId: string, map: any): void {
    this.mapInstances.set(mapId, map);
    this.routeLayers.set(mapId, []);
    this.markerLayers.set(mapId, []);
  }

  // Get map instance
  getMap(mapId: string = 'default'): any {
    return this.mapInstances.get(mapId);
  }

  // Draw route on map
  async drawRoute(mapId: string, route: any, color: string = '#4CAF50'): Promise<void> {
    const map = this.mapInstances.get(mapId);
    if (!map) return;

    // Import Leaflet dynamically
    const L = await this.getLeaflet();
    
    // Create polyline from route coordinates
    const coordinates = route.coordinates || [];
    if (coordinates.length === 0) return;

    const polyline = L.polyline(
      coordinates.map((c: any) => [c.lat, c.lng]),
      { color, weight: 4, opacity: 0.7 }
    ).addTo(map);

    // Store layer for later removal
    const layers = this.routeLayers.get(mapId) || [];
    layers.push(polyline);
    this.routeLayers.set(mapId, layers);

    // Fit map to route bounds
    map.fitBounds(polyline.getBounds(), { padding: [50, 50] });
  }

  // Clear all routes from map
  clearRoutes(mapId: string = 'default'): void {
    const map = this.mapInstances.get(mapId);
    const layers = this.routeLayers.get(mapId) || [];

    if (map) {
      layers.forEach((layer: any) => {
        try {
          map.removeLayer(layer);
        } catch (e) {
          // Layer may already be removed
        }
      });
    }

    this.routeLayers.set(mapId, []);
  }

  // Add marker to map
  async addMarker(
    mapId: string,
    lat: number,
    lng: number,
    options?: { 
      title?: string; 
      icon?: string; 
      color?: string;
      draggable?: boolean;
      popup?: string;
    }
  ): Promise<any> {
    const map = this.mapInstances.get(mapId);
    if (!map) return null;

    const L = await this.getLeaflet();

    // Create marker
    const markerOptions: any = {
      title: options?.title || '',
      draggable: options?.draggable || false
    };

    // Create custom icon if color specified
    if (options?.color) {
      markerOptions.icon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="background-color: ${options.color}; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white;"></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 24]
      });
    }

    const marker = L.marker([lat, lng], markerOptions).addTo(map);

    // Add popup if specified
    if (options?.popup) {
      marker.bindPopup(options.popup);
    }

    // Store marker for later removal
    const markers = this.markerLayers.get(mapId) || [];
    markers.push(marker);
    this.markerLayers.set(mapId, markers);

    return marker;
  }

  // Clear all markers from map
  clearMarkers(mapId: string = 'default'): void {
    const map = this.mapInstances.get(mapId);
    const markers = this.markerLayers.get(mapId) || [];

    if (map) {
      markers.forEach((marker: any) => {
        try {
          map.removeLayer(marker);
        } catch (e) {
          // Marker may already be removed
        }
      });
    }

    this.markerLayers.set(mapId, []);
  }

  // Get Leaflet library (lazy load)
  private async getLeaflet(): Promise<any> {
    // In real app, dynamically import Leaflet
    // For now, assume it's globally available
    return (window as any).L;
  }
}
