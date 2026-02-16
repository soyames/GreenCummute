import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { PointsService } from '../../services/points.service';
import { RouteService } from '../../services/route.service';
import { AuthService } from '../../services/auth.service';
import { UserStats } from '../../models/points.model';

@Component({
  selector: 'app-statistics',
  templateUrl: './statistics.page.html',
  styleUrls: ['./statistics.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class StatisticsPage implements OnInit {
  stats: UserStats = {
    totalPoints: 0,
    totalRoutes: 0,
    totalDistance: 0,
    totalCO2Saved: 0,
    averageEcoScore: 0,
    achievements: [],
    currentStreak: 0,
    longestStreak: 0,
    transportModeBreakdown: []
  };
  
  isLoading = false;
  timeframe: 'week' | 'month' | 'year' | 'alltime' = 'month';

  constructor(
    private pointsService: PointsService,
    private routeService: RouteService,
    private authService: AuthService
  ) {}

  async ngOnInit() {
    await this.loadStatistics();
  }

  async loadStatistics() {
    this.isLoading = true;
    try {
      const user = await this.authService.getCurrentUser();
      if (user) {
        this.stats = await this.pointsService.getUserStats(user.uid);
      }
    } catch (error) {
      console.error('Error loading statistics:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async onTimeframeChange(event: any) {
    this.timeframe = event.detail.value;
    await this.loadStatistics();
  }

  getTransportModeIcon(mode: string): string {
    const icons: Record<string, string> = {
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
    return icons[mode] || 'ellipse';
  }

  getModePercentage(count: number): number {
    const total = this.stats.transportModeBreakdown.reduce((sum, mode) => sum + mode.count, 0);
    return total > 0 ? (count / total) * 100 : 0;
  }

  formatDistance(meters: number): string {
    return (meters / 1000).toFixed(1) + ' km';
  }

  formatCO2(grams: number): string {
    if (grams >= 1000) {
      return (grams / 1000).toFixed(2) + ' kg';
    }
    return grams.toFixed(0) + ' g';
  }

  getTreesEquivalent(): number {
    const CO2_PER_TREE_PER_YEAR = 21000;
    return this.stats.totalCO2Saved / CO2_PER_TREE_PER_YEAR;
  }
}
