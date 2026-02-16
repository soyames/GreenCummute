import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController, LoadingController } from '@ionic/angular';
import { Router } from '@angular/router';
import { MapService } from '../../services/map.service';
import { RouteService } from '../../services/route.service';
import { PointsService } from '../../services/points.service';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { Route, RouteComparison } from '../../models/route.model';
import { TransportMode } from '../../models/user.model';
import { DataDisclaimerComponent } from '../../components/data-disclaimer/data-disclaimer.component';
import * as L from 'leaflet';

@Component({
  selector: 'app-navigation',
  templateUrl: './navigation.page.html',
  styleUrls: ['./navigation.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, DataDisclaimerComponent]
})
export class NavigationPage implements OnInit, AfterViewInit, OnDestroy {
  originAddress = '';
  destinationAddress = '';
  originSuggestions: any[] = [];
  destinationSuggestions: any[] = [];
  originCoords: { lat: number; lng: number } | null = null;
  destCoords: { lat: number; lng: number } | null = null;
  
  selectedTransportModes: TransportMode[] = ['walk', 'bike', 'bus', 'train'];
  optimizeFor: 'eco' | 'time' | 'balanced' = 'eco';
  
  routeComparison?: RouteComparison;
  selectedRoute?: Route;
  isCalculating = false;
  isNavigating = false;
  currentLocation: { latitude: number; longitude: number } | null = null;
  
  // Navigation tracking
  navigationStartTime: Date | null = null;
  distanceTraveled = 0;
  currentMarker?: L.Marker;
  trackingInterval: any;
  
  private map?: L.Map;
  private searchTimeout: any;
  
  transportModeIcons: Record<TransportMode, string> = {
    walk: 'walk',
    bike: 'bicycle',
    ebike: 'bicycle',
    scooter: 'bicycle',
    bus: 'bus',
    train: 'train',
    tram: 'train',
    car: 'car',
    carpool: 'car-sport'
  };

  constructor(
    private mapService: MapService,
    private routeService: RouteService,
    private pointsService: PointsService,
    private authService: AuthService,
    private userService: UserService,
    private toastController: ToastController,
    private loadingController: LoadingController,
    private router: Router
  ) {}

  async ngOnInit() {
    await this.getCurrentLocation();
  }

  async ngAfterViewInit() {
    // Initialize map after view is ready
    setTimeout(() => this.initMap(), 300);
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
    }
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
    }
    if (this.isNavigating) {
      this.mapService.stopWatchingLocation();
    }
  }

  async initMap() {
    try {
      const lat = this.currentLocation?.latitude || 48.2082;
      const lng = this.currentLocation?.longitude || 16.3738;

      this.map = await this.mapService.createMap('map-container', {
        center: [lat, lng],
        zoom: 13
      });

      if (this.currentLocation) {
        await this.mapService.addMarker('map-container', lat, lng, {
          color: 'primary',
          popup: 'Your location'
        });
      } else {
        // Show Vienna as default with different popup
        await this.mapService.addMarker('map-container', lat, lng, {
          color: 'medium',
          popup: 'Default location (Vienna). Enable location services for your position.'
        });
      }
    } catch (error) {
      console.error('Map init error:', error);
      this.showToast('Map loaded. Enter addresses to find routes.', 'primary');
    }
  }

  async getCurrentLocation() {
    try {
      const position = await this.mapService.getCurrentLocation();
      this.currentLocation = {
        latitude: position.lat,
        longitude: position.lng
      };
      
      this.originCoords = { lat: position.lat, lng: position.lng };
      
      const address = await this.mapService.reverseGeocode(
        position.lat,
        position.lng
      );
      this.originAddress = address;
      
      console.log('Current location loaded:', { position, address });
    } catch (error: any) {
      console.error('Location error:', error);
    }
  }

  async useCurrentLocation() {
    const loading = await this.loadingController.create({
      message: 'Getting your location...'
    });
    await loading.present();

    try {
      const position = await this.mapService.getCurrentLocation();
      
      if (!position || !position.lat || !position.lng) {
        throw new Error('Invalid location data received');
      }

      this.currentLocation = {
        latitude: position.lat,
        longitude: position.lng
      };
      
      this.originCoords = { lat: position.lat, lng: position.lng };
      
      const address = await this.mapService.reverseGeocode(position.lat, position.lng);
      this.originAddress = address;

      // Update map
      if (this.map) {
        this.mapService.clearMarkers('map-container');
        await this.mapService.addMarker('map-container', position.lat, position.lng, {
          color: 'primary',
          popup: 'Your location'
        });
        this.map.setView([position.lat, position.lng], 15);
      }

      this.showToast('Location updated!', 'success');
    } catch (error: any) {
      console.error('Error getting location:', error);
      
      // Provide more detailed error messages
      let errorMessage = 'Could not get location.';
      if (error.message?.includes('permission denied') || error.message?.includes('Permission') || error.message?.includes('denied')) {
        errorMessage = 'Location permission denied. Please enable location access in your browser/device settings.';
      } else if (error.message?.includes('timeout')) {
        errorMessage = 'Location request timed out. Please try again.';
      } else if (error.message?.includes('unavailable')) {
        errorMessage = 'Location services unavailable. Please enable GPS on your device.';
      } else {
        errorMessage = `Could not get location: ${error.message || 'Unknown error'}`;
      }
      
      this.showToast(errorMessage, 'danger', 5000);
    } finally {
      await loading.dismiss();
    }
  }

  // Address autocomplete
  async onOriginInput(event: any) {
    const query = event.target.value;
    if (query && query.length > 2) {
      clearTimeout(this.searchTimeout);
      this.searchTimeout = setTimeout(async () => {
        this.originSuggestions = await this.searchAddress(query);
      }, 500);
    } else {
      this.originSuggestions = [];
    }
  }

  async onDestinationInput(event: any) {
    const query = event.target.value;
    if (query && query.length > 2) {
      clearTimeout(this.searchTimeout);
      this.searchTimeout = setTimeout(async () => {
        this.destinationSuggestions = await this.searchAddress(query);
      }, 500);
    } else {
      this.destinationSuggestions = [];
    }
  }

  async searchAddress(query: string): Promise<any[]> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`,
        {
          headers: {
            'User-Agent': 'GreenCommute App'
          }
        }
      );
      return await response.json();
    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  }

  selectOriginSuggestion(suggestion: any) {
    this.originAddress = suggestion.display_name;
    this.originCoords = {
      lat: parseFloat(suggestion.lat),
      lng: parseFloat(suggestion.lon)
    };
    this.originSuggestions = [];
  }

  selectDestinationSuggestion(suggestion: any) {
    this.destinationAddress = suggestion.display_name;
    this.destCoords = {
      lat: parseFloat(suggestion.lat),
      lng: parseFloat(suggestion.lon)
    };
    this.destinationSuggestions = [];
  }

  async calculateRoutes() {
    if (!this.originAddress || !this.destinationAddress) {
      this.showToast('Please enter both origin and destination', 'warning');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Calculating eco-friendly routes...'
    });
    await loading.present();

    this.isCalculating = true;

    try {
      // Use saved coordinates if available, otherwise geocode
      const originCoords = this.originCoords || await this.mapService.geocode(this.originAddress);
      const destCoords = this.destCoords || await this.mapService.geocode(this.destinationAddress);

      console.log('Calculating route from', originCoords, 'to', destCoords);

      const origin: any = {
        lat: originCoords.lat,
        lng: originCoords.lng,
        address: this.originAddress
      };

      const destination: any = {
        lat: destCoords.lat,
        lng: destCoords.lng,
        address: this.destinationAddress
      };

      const preferences = {
        ecoBalance: 80,
        modes: this.selectedTransportModes,
        maxWalkDistance: 2000
      };

      const routes = await this.routeService.calculateRoutes(origin, destination, preferences);
      
      if (routes && routes.length > 0) {
        this.routeComparison = {
          routes: routes as any,
          recommendations: {
            mostEco: routes[0] as any,
            fastest: routes[routes.length - 1] as any || routes[0] as any,
            balanced: routes[Math.floor(routes.length / 2)] as any || routes[0] as any
          }
        };
        this.selectedRoute = routes[0] as any;

        // Clear and update map
        this.mapService.clearMarkers('map-container');
        this.mapService.clearRoutes('map-container');

        // Add markers
        await this.mapService.addMarker('map-container', originCoords.lat, originCoords.lng, {
          color: 'success',
          popup: 'Start: ' + this.originAddress
        });

        await this.mapService.addMarker('map-container', destCoords.lat, destCoords.lng, {
          color: 'danger',
          popup: 'Destination: ' + this.destinationAddress
        });

        // Draw the route
        console.log('Drawing route:', this.selectedRoute);
        await this.displayRoute(this.selectedRoute);

        this.showToast(`Found ${routes.length} eco-friendly routes!`, 'success');
      } else {
        this.showToast('No routes found', 'warning');
      }
    } catch (error: any) {
      console.error('Route calc error:', error);
      this.showToast(error.message || 'Failed to calculate routes', 'danger');
    } finally {
      this.isCalculating = false;
      await loading.dismiss();
    }
  }

  async displayRoute(route: Route) {
    try {
      const map = this.mapService.getMap('map-container');
      if (!map) {
        console.error('Map not found');
        return;
      }

      this.mapService.clearRoutes('map-container');
      
      // Check if route has origin and destination
      const origin = route.origin;
      const destination = route.destination;
      
      if (!origin || !destination) {
        console.error('Route missing origin or destination');
        return;
      }

      // Get coordinates
      const originLat = (origin as any).latitude || (origin as any).lat;
      const originLng = (origin as any).longitude || (origin as any).lng;
      const destLat = (destination as any).latitude || (destination as any).lat;
      const destLng = (destination as any).longitude || (destination as any).lng;

      if (!originLat || !originLng || !destLat || !destLng) {
        console.error('Invalid coordinates', { origin, destination });
        return;
      }

      // Use Leaflet directly to draw
      const L = (window as any).L;
      if (!L) {
        console.error('Leaflet not loaded');
        return;
      }

      const color = route.ecoScore >= 80 ? '#4CAF50' : (route.ecoScore >= 60 ? '#8BC34A' : '#FFC107');
      
      const latlngs: [number, number][] = [
        [originLat, originLng],
        [destLat, destLng]
      ];

      const polyline = L.polyline(latlngs, {
        color: color,
        weight: 4,
        opacity: 0.7
      }).addTo(map);

      // Fit map to show entire route
      map.fitBounds(polyline.getBounds(), { padding: [50, 50] });

      console.log('Route drawn successfully', { origin: [originLat, originLng], dest: [destLat, destLng], color });
    } catch (error) {
      console.error('Display route error:', error);
    }
  }

  async selectRoute(route: Route) {
    this.selectedRoute = route;
    await this.displayRoute(route);
  }

  isTransportModeSelected(mode: TransportMode): boolean {
    return this.selectedTransportModes.includes(mode);
  }

  toggleTransportMode(mode: TransportMode) {
    const index = this.selectedTransportModes.indexOf(mode);
    if (index > -1) {
      // Don't allow removing all modes
      if (this.selectedTransportModes.length > 1) {
        this.selectedTransportModes.splice(index, 1);
      }
    } else {
      this.selectedTransportModes.push(mode);
    }
  }

  async startNavigation() {
    if (!this.selectedRoute) {
      this.showToast('Please select a route first', 'warning');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Starting navigation...'
    });
    await loading.present();

    try {
      const user = await this.authService.getCurrentUser();
      if (!user) {
        await loading.dismiss();
        this.showToast('Please log in to start navigation', 'warning');
        return;
      }

      console.log('Starting navigation with route:', this.selectedRoute);

      // Save route first
      await this.routeService.saveRoute(this.selectedRoute as any, user.uid);
      
      // Initialize navigation tracking
      this.navigationStartTime = new Date();
      this.distanceTraveled = 0;
      this.isNavigating = true;

      // Start watching location with callback
      await this.mapService.startWatchingLocation((location) => {
        this.onLocationUpdate(location);
      });

      // Start distance tracking interval
      this.trackingInterval = setInterval(() => {
        this.updateNavigationStats();
      }, 5000); // Update every 5 seconds

      await loading.dismiss();
      this.showToast('Navigation started! Tracking your position...', 'success', 3000);
    } catch (error: any) {
      console.error('Navigation start error:', error);
      await loading.dismiss();
      this.showToast(`Failed to start navigation: ${error.message || 'Unknown error'}`, 'danger', 4000);
    }
  }

  // Called when location updates during navigation
  private onLocationUpdate(location: { lat: number; lng: number }) {
    if (!this.isNavigating || !this.map) return;

    console.log('Location updated during navigation:', location);

    // Update current location marker
    if (this.currentMarker) {
      this.currentMarker.setLatLng([location.lat, location.lng]);
    } else {
      // Create a marker for current position
      this.currentMarker = L.marker([location.lat, location.lng], {
        icon: L.icon({
          iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        })
      }).addTo(this.map);
      this.currentMarker.bindPopup('You are here').openPopup();
    }

    // Center map on current location (optional, can be toggled)
    this.map.setView([location.lat, location.lng], 16);

    // Update current location state
    this.currentLocation = {
      latitude: location.lat,
      longitude: location.lng
    };
  }

  // Update navigation statistics
  private updateNavigationStats() {
    if (!this.navigationStartTime || !this.currentLocation || !this.selectedRoute) return;

    const elapsedMs = new Date().getTime() - this.navigationStartTime.getTime();
    const elapsedMinutes = Math.floor(elapsedMs / 60000);

    console.log(`Navigation in progress: ${elapsedMinutes} minutes`);
    
    // TODO: Calculate actual distance traveled
    // This would require storing previous positions and calculating distance between them
  }

  async endNavigation() {
    if (!this.selectedRoute) return;

    const loading = await this.loadingController.create({
      message: 'Completing route...'
    });
    await loading.present();

    try {
      const user = await this.authService.getCurrentUser();
      if (user) {
        // Stop tracking
        await this.mapService.stopWatchingLocation();
        if (this.trackingInterval) {
          clearInterval(this.trackingInterval);
          this.trackingInterval = null;
        }

        // Calculate elapsed time
        const elapsedMs = this.navigationStartTime 
          ? new Date().getTime() - this.navigationStartTime.getTime()
          : 0;
        const elapsedMinutes = Math.floor(elapsedMs / 60000);

        // Save completed route
        await this.routeService.saveRoute(this.selectedRoute as any, user.uid);
        
        // Award points
        const points = await this.pointsService.calculateAndAwardPoints(
          user.uid,
          {
            route: this.selectedRoute as any,
            completedAt: new Date()
          }
        );

        this.isNavigating = false;
        this.navigationStartTime = null;

        // Remove current position marker
        if (this.currentMarker) {
          this.currentMarker.remove();
          this.currentMarker = undefined;
        }

        // Update user's total points display
        await this.updateUserStats(user.uid);

        await loading.dismiss();

        this.showToast(
          `🎉 Route completed in ${elapsedMinutes} min! +${points} points earned! You saved ${this.selectedRoute.co2Saved}g CO2!`,
          'success',
          6000
        );

        setTimeout(() => this.router.navigate(['/tabs/profile']), 2000);
      }
    } catch (error) {
      console.error('End navigation error:', error);
      this.isNavigating = false;
      await loading.dismiss();
      this.showToast('Failed to complete route', 'danger');
    }
  }

  formatDistance(meters: number): string {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  }

  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  getEcoScoreColor(score: number): string {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'danger';
  }

  private async showToast(message: string, color: string = 'primary', duration: number = 3000) {
    const toast = await this.toastController.create({
      message,
      duration,
      color,
      position: 'bottom'
    });
    await toast.present();
  }

  private async updateUserStats(uid: string) {
    try {
      // Refresh user profile to show updated points
      const profile = await this.userService.getUserProfile(uid);
      console.log('User stats updated:', {
        points: profile?.points,
        totalDistance: profile?.totalDistance,
        co2Saved: profile?.co2Saved
      });
    } catch (error) {
      console.error('Error updating user stats:', error);
    }
  }
}
