import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { RouteService } from '../../services/route.service';
import { AuthService } from '../../services/auth.service';
import { Route } from '../../models/route.model';
import { TransportMode } from '../../models/user.model';

@Component({
  selector: 'app-route-history',
  templateUrl: './route-history.page.html',
  styleUrls: ['./route-history.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class RouteHistoryPage implements OnInit {
  routes: Route[] = [];
  favorites: Route[] = [];
  selectedSegment = 'all';
  isLoading = false;

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
    private routeService: RouteService,
    private authService: AuthService,
    private alertController: AlertController,
    private router: Router
  ) {}

  async ngOnInit() {
    await this.loadRoutes();
  }

  async loadRoutes() {
    this.isLoading = true;
    try {
      const user = await this.authService.getCurrentUser();
      if (user) {
        this.routes = await this.routeService.getRouteHistory(user.uid);
        this.favorites = this.routes.filter(r => r.favorite);
      }
    } catch (error) {
      console.error('Error loading routes:', error);
    } finally {
      this.isLoading = false;
    }
  }

  get displayedRoutes(): Route[] {
    if (this.selectedSegment === 'favorites') {
      return this.favorites;
    }
    return this.routes;
  }

  segmentChanged(event: any) {
    this.selectedSegment = event.detail.value;
  }

  async toggleFavorite(route: Route) {
    try {
      route.favorite = !route.favorite;
      // await this.routeService.updateRoute(route); // Not implemented yet
      
      if (route.favorite) {
        this.favorites.push(route);
      } else {
        this.favorites = this.favorites.filter(r => r.id !== route.id);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      route.favorite = !route.favorite;
    }
  }

  async deleteRoute(route: Route) {
    const alert = await this.alertController.create({
      header: 'Delete Route',
      message: 'Are you sure you want to delete this route?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: async () => {
            try {
              // await this.routeService.deleteRoute(route.id); // Not implemented yet
              this.routes = this.routes.filter(r => r.id !== route.id);
              this.favorites = this.favorites.filter(r => r.id !== route.id);
            } catch (error) {
              console.error('Error deleting route:', error);
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async repeatRoute(route: Route) {
    this.router.navigate(['/tabs/navigation'], {
      state: {
        origin: route.origin,
        destination: route.destination,
        transportMode: route.transportMode
      }
    });
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
}
