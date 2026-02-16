import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { PointsService } from '../../services/points.service';
import { AuthService } from '../../services/auth.service';
import { Achievement } from '../../models/points.model';

@Component({
  selector: 'app-achievements',
  templateUrl: './achievements.page.html',
  styleUrls: ['./achievements.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class AchievementsPage implements OnInit {
  achievements: Achievement[] = [];
  unlockedAchievements: Achievement[] = [];
  lockedAchievements: Achievement[] = [];
  selectedFilter = 'all';
  isLoading = false;

  constructor(
    private pointsService: PointsService,
    private authService: AuthService
  ) {}

  async ngOnInit() {
    await this.loadAchievements();
  }

  async loadAchievements() {
    this.isLoading = true;
    try {
      const user = await this.authService.getCurrentUser();
      if (user) {
        this.achievements = await this.pointsService.getAchievements(user.uid);
        this.unlockedAchievements = this.achievements.filter(a => a.unlocked);
        this.lockedAchievements = this.achievements.filter(a => !a.unlocked);
      }
    } catch (error) {
      console.error('Error loading achievements:', error);
    } finally {
      this.isLoading = false;
    }
  }

  get displayedAchievements(): Achievement[] {
    if (this.selectedFilter === 'unlocked') {
      return this.unlockedAchievements;
    } else if (this.selectedFilter === 'locked') {
      return this.lockedAchievements;
    }
    return this.achievements;
  }

  getProgress(achievement: Achievement): number {
    if (!achievement.progress) return 0;
    return (achievement.progress / achievement.requirement.value) * 100;
  }

  segmentChanged(event: any) {
    this.selectedFilter = event.detail.value;
  }
}
