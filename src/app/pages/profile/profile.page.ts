import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { DataDisclaimerComponent } from '../../components/data-disclaimer/data-disclaimer.component';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, DataDisclaimerComponent]
})
export class ProfilePage implements OnInit {
  firstName: string = '';
  lastName: string = '';
  city: string = '';
  occupation: string = '';
  email: string = '';
  phoneNumber: string = '';
  profilePictureUrl: string = '';
  points: number = 0;
  isLoading = false;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private toastController: ToastController
  ){}
   

  async ngOnInit() {
    await this.loadProfile();
  }

  async loadProfile() {
    try {
      const user = await this.authService.getCurrentUser();
      if (user) {
        const profile = await this.userService.getUserProfile(user.uid);
        if (profile) {
          this.firstName = profile.firstName || '';
          this.lastName = profile.lastName || '';
          this.city = profile.city || '';
          this.occupation = profile.occupation || '';
          this.email = profile.email || '';
          this.phoneNumber = profile.phoneNumber || '';
          this.profilePictureUrl = (profile as any).avatarUrl || '';
          this.points = profile.points || 0;
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      const toast = await this.toastController.create({
        message: 'Failed to load profile',
        duration: 2000,
        color: 'danger'
      });
      await toast.present();
    }
  }

  async handleFileInput(event: any) {
    const file = event.target.files[0];
    if (file) {
      try {
        this.isLoading = true;
        const user = await this.authService.getCurrentUser();
        if (user) {
          const avatarUrl = await this.userService.uploadAvatar(user.uid, file);
          this.profilePictureUrl = avatarUrl;
          
          const toast = await this.toastController.create({
            message: 'Profile picture updated successfully',
            duration: 2000,
            color: 'success'
          });
          await toast.present();
        }
      } catch (error) {
        console.error('Error uploading avatar:', error);
        const toast = await this.toastController.create({
          message: 'Failed to upload profile picture',
          duration: 2000,
          color: 'danger'
        });
        await toast.present();
      } finally {
        this.isLoading = false;
      }
    }
  }

}
