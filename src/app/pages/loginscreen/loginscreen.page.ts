import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule, ToastController, LoadingController } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { DataDisclaimerComponent } from '../../components/data-disclaimer/data-disclaimer.component';

@Component({
  selector: 'app-loginscreen',
  templateUrl: './loginscreen.page.html',
  styleUrls: ['./loginscreen.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, ReactiveFormsModule, DataDisclaimerComponent]
})
export class LoginscreenPage implements OnInit {
  loginForm: FormGroup;
  isLoading = false;

  constructor(
    private router: Router,
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private userService: UserService,
    private toastController: ToastController,
    private loadingController: LoadingController
  ) {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit() {}

  async loginWithEmail() {
    if (this.loginForm.invalid) {
      await this.showToast('Please enter valid email and password');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Signing in...'
    });
    await loading.present();

    try {
      const { email, password } = this.loginForm.value;
      const credential = await this.authService.loginWithEmail(email, password);
      
      // Load user profile
      await this.userService.getUserProfile(credential.user.uid);
      
      await loading.dismiss();
      await this.showToast('Welcome back!', 'success');
      this.router.navigateByUrl('tabs/home');
    } catch (error: any) {
      await loading.dismiss();
      await this.showToast(error.message, 'danger');
    }
  }

  async loginWithGoogle() {
    const loading = await this.loadingController.create({
      message: 'Signing in with Google...'
    });
    await loading.present();

    try {
      const credential = await this.authService.loginWithGoogle();
      
      // Check if user profile exists, create if not
      let profile = await this.userService.getUserProfile(credential.user.uid);
      if (!profile) {
        await this.userService.createUserProfile(credential.user.uid, credential.user.email!, {
          displayName: credential.user.displayName || '',
          photoURL: credential.user.photoURL || ''
        });
      }
      
      await loading.dismiss();
      await this.showToast('Welcome!', 'success');
      this.router.navigateByUrl('tabs/home');
    } catch (error: any) {
      await loading.dismiss();
      if (!error.message.includes('closed')) {
        await this.showToast(error.message, 'danger');
      }
    }
  }

  async loginWithFacebook() {
    const loading = await this.loadingController.create({
      message: 'Signing in with Facebook...'
    });
    await loading.present();

    try {
      const credential = await this.authService.loginWithFacebook();
      
      // Check if user profile exists, create if not
      let profile = await this.userService.getUserProfile(credential.user.uid);
      if (!profile) {
        await this.userService.createUserProfile(credential.user.uid, credential.user.email!, {
          displayName: credential.user.displayName || '',
          photoURL: credential.user.photoURL || ''
        });
      }
      
      await loading.dismiss();
      await this.showToast('Welcome!', 'success');
      this.router.navigateByUrl('tabs/home');
    } catch (error: any) {
      await loading.dismiss();
      if (!error.message.includes('closed')) {
        await this.showToast(error.message, 'danger');
      }
    }
  }

  async loginWithApple() {
    const loading = await this.loadingController.create({
      message: 'Signing in with Apple...'
    });
    await loading.present();

    try {
      const credential = await this.authService.loginWithApple();
      
      // Check if user profile exists, create if not
      let profile = await this.userService.getUserProfile(credential.user.uid);
      if (!profile) {
        await this.userService.createUserProfile(credential.user.uid, credential.user.email!, {
          displayName: credential.user.displayName || '',
          photoURL: credential.user.photoURL || ''
        });
      }
      
      await loading.dismiss();
      await this.showToast('Welcome!', 'success');
      this.router.navigateByUrl('tabs/home');
    } catch (error: any) {
      await loading.dismiss();
      if (!error.message.includes('closed')) {
        await this.showToast(error.message, 'danger');
      }
    }
  }

  forgotPassword() {
    this.router.navigateByUrl('forgotpwd');
  }

  goToRegister() {
    this.router.navigateByUrl('registration');
  }

  private async showToast(message: string, color: string = 'dark') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}

