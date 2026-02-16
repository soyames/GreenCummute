import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { StorageService } from '../../services/storage.service';
import { UserPreferences } from '../../models/user.model';
import { DataDisclaimerComponent } from '../../components/data-disclaimer/data-disclaimer.component';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, DataDisclaimerComponent]
})
export class SettingsPage implements OnInit {
  preferences: UserPreferences = {
    routePreference: 'eco',
    preferredTransportModes: ['walk', 'bike', 'bus'],
    notifications: {
      routeUpdates: true,
      pointsEarned: true,
      achievements: true,
      promotions: false
    },
    privacy: {
      shareLocation: true,
      shareStatistics: true,
      publicProfile: false
    },
    darkMode: false,
    language: 'en'
  };

  languages = [
    { code: 'en', name: 'English' },
    { code: 'de', name: 'Deutsch' },
    { code: 'fr', name: 'Français' },
    { code: 'es', name: 'Español' }
  ];

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private storageService: StorageService,
    private toastController: ToastController,
    private router: Router
  ) {}

  async ngOnInit() {
    await this.loadPreferences();
  }

  async loadPreferences() {
    try {
      const user = await this.authService.getCurrentUser();
      if (user) {
        const profile = await this.userService.getUserProfile(user.uid);
        if ((profile as any)?.preferences) {
          this.preferences = (profile as any).preferences;
        }
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  }

  async savePreferences() {
    try {
      const user = await this.authService.getCurrentUser();
      if (user) {
        await this.userService.updateUserProfile(user.uid, { preferences: this.preferences } as any);
        await this.showToast('Settings saved', 'success');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      await this.showToast('Failed to save settings', 'danger');
    }
  }

  onDarkModeToggle(event: any) {
    this.preferences.darkMode = event.detail.checked;
    document.body.classList.toggle('dark', this.preferences.darkMode);
    this.savePreferences();
  }

  async clearCache() {
    try {
      await this.storageService.clear();
      await this.showToast('Cache cleared', 'success');
    } catch (error) {
      console.error('Error clearing cache:', error);
      await this.showToast('Failed to clear cache', 'danger');
    }
  }

  async logout() {
    try {
      await this.authService.logout();
      await this.showToast('Logged out successfully', 'success');
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Error logging out:', error);
      await this.showToast('Failed to logout', 'danger');
    }
  }

  async showToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color
    });
    await toast.present();
  }
}
