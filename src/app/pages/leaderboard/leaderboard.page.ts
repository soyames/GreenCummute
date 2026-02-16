import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { PointsService } from '../../services/points.service';
import { AuthService } from '../../services/auth.service';
import { LeaderboardEntry } from '../../models/points.model';

@Component({
  selector: 'app-leaderboard',
  templateUrl: './leaderboard.page.html',
  styleUrls: ['./leaderboard.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class LeaderboardPage implements OnInit {
  leaderboard: LeaderboardEntry[] = [];
  currentUserId = '';
  userRank?: LeaderboardEntry;
  isLoading = false;
  timeframe: 'week' | 'month' | 'alltime' = 'week';

  constructor(
    private pointsService: PointsService,
    private authService: AuthService
  ) {}

  async ngOnInit() {
    const user = await this.authService.getCurrentUser();
    if (user) {
      this.currentUserId = user.uid;
    }
    await this.loadLeaderboard();
  }

  async loadLeaderboard() {
    this.isLoading = true;
    try {
      this.leaderboard = await this.pointsService.getLeaderboard(50, this.timeframe);
      this.userRank = this.leaderboard.find(entry => entry.userId === this.currentUserId);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async onTimeframeChange(event: any) {
    this.timeframe = event.detail.value;
    await this.loadLeaderboard();
  }

  getRankColor(rank: number): string {
    if (rank === 1) return 'warning';
    if (rank === 2) return 'medium';
    if (rank === 3) return 'tertiary';
    return 'primary';
  }

  getRankIcon(rank: number): string {
    if (rank === 1) return 'trophy';
    if (rank === 2) return 'medal';
    if (rank === 3) return 'medal';
    return 'ribbon';
  }

  isCurrentUser(userId: string): boolean {
    return userId === this.currentUserId;
  }
}
