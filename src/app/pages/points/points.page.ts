import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { PointsService } from '../../services/points.service';

@Component({
  selector: 'app-points',
  templateUrl: './points.page.html',
  styleUrls: ['./points.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class PointsPage implements OnInit {
  currentPoints: number = 0;
  transactions: any[] = [];
  isLoading: boolean = false;
  selectedSegment: string = 'balance';

  // Stats
  totalEarned: number = 0;
  totalSpent: number = 0;
  thisMonth: number = 0;
  thisWeek: number = 0;

  constructor(
    private authService: AuthService,
    private pointsService: PointsService,
    private router: Router
  ) {}

  async ngOnInit() {
    await this.loadPoints();
  }

  async loadPoints() {
    try {
      this.isLoading = true;
      const user = await this.authService.getCurrentUser();
      
      if (!user) {
        this.router.navigate(['/loginscreen']);
        return;
      }

      // Get current balance
      this.currentPoints = await this.pointsService.getPointsBalance(user.uid);

      // Get history
      const history = await this.pointsService.getPointsHistory(user.uid);
      this.transactions = history.transactions;
      this.totalEarned = history.totalEarned;
      this.totalSpent = history.totalSpent;

      // Calculate this month/week totals
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

      this.thisWeek = this.transactions
        .filter(t => t.type === 'earn' && new Date(t.timestamp) >= oneWeekAgo)
        .reduce((sum, t) => sum + t.amount, 0);

      this.thisMonth = this.transactions
        .filter(t => t.type === 'earn' && new Date(t.timestamp) >= oneMonthAgo)
        .reduce((sum, t) => sum + t.amount, 0);

    } catch (error) {
      console.error('Error loading points:', error);
    } finally {
      this.isLoading = false;
    }
  }

  segmentChanged(event: any) {
    this.selectedSegment = event.detail.value;
  }

  formatDate(date: any): string {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  getTransactionIcon(type: string): string {
    return type === 'earn' ? 'arrow-down' : 'arrow-up';
  }

  getTransactionColor(type: string): string {
    return type === 'earn' ? 'success' : 'warning';
  }

  goToPartners() {
    this.router.navigate(['/tabs/partners']);
  }

  goToLeaderboard() {
    this.router.navigate(['/tabs/leaderboard']);
  }

  goToNavigation() {
    this.router.navigate(['/tabs/navigation']);
  }

  async refreshPoints(event: any) {
    await this.loadPoints();
    event.target.complete();
  }
}
