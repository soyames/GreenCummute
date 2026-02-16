import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule, ToastController, LoadingController } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { DataDisclaimerComponent } from '../../components/data-disclaimer/data-disclaimer.component';

@Component({
  selector: 'app-registration',
  templateUrl: './registration.page.html',
  styleUrls: ['./registration.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, ReactiveFormsModule, DataDisclaimerComponent]
})
export class RegistrationPage implements OnInit {
  registrationForm: FormGroup;
  selectedFile: File | null = null;
  isLoading = false;

  constructor(
    private router: Router,
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private userService: UserService,
    private toastController: ToastController,
    private loadingController: LoadingController
  ) {
    this.registrationForm = this.formBuilder.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      city: [''],
      occupation: [''],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: [''],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit() {}

  passwordMatchValidator(group: FormGroup) {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  handleFileInput(event: any) {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.selectedFile = files[0];
    }
  }

  async createUser() {
    if (this.registrationForm.invalid) {
      await this.showToast('Please fill all required fields correctly');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Creating your account...'
    });
    await loading.present();

    try {
      const formValue = this.registrationForm.value;
      
      // Create auth account
      const credential = await this.authService.registerWithEmail(
        formValue.email,
        formValue.password
      );

      // Create user profile
      await this.userService.createUserProfile(credential.user.uid, credential.user.email!, {
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        displayName: `${formValue.firstName} ${formValue.lastName}`,
        city: formValue.city,
        occupation: formValue.occupation,
        phoneNumber: formValue.phoneNumber
      });

      // Upload avatar if selected
      if (this.selectedFile) {
        await this.userService.uploadAvatar(credential.user.uid, this.selectedFile);
      }

      await loading.dismiss();
      await this.showToast('Account created successfully!', 'success');
      this.router.navigateByUrl('tabs/home');
    } catch (error: any) {
      await loading.dismiss();
      await this.showToast(error.message, 'danger');
    }
  }

  async registerWithGoogle() {
    const loading = await this.loadingController.create({
      message: 'Signing up with Google...'
    });
    await loading.present();

    try {
      const credential = await this.authService.loginWithGoogle();
      
      // Create user profile
      await this.userService.createUserProfile(credential.user.uid, credential.user.email!, {
        displayName: credential.user.displayName || '',
        photoURL: credential.user.photoURL || ''
      });
      
      await loading.dismiss();
      await this.showToast('Account created successfully!', 'success');
      this.router.navigateByUrl('tabs/home');
    } catch (error: any) {
      await loading.dismiss();
      if (!error.message.includes('closed')) {
        await this.showToast(error.message, 'danger');
      }
    }
  }

  async registerWithFacebook() {
    const loading = await this.loadingController.create({
      message: 'Signing up with Facebook...'
    });
    await loading.present();

    try {
      const credential = await this.authService.loginWithFacebook();
      
      // Create user profile
      await this.userService.createUserProfile(credential.user.uid, credential.user.email!, {
        displayName: credential.user.displayName || '',
        photoURL: credential.user.photoURL || ''
      });
      
      await loading.dismiss();
      await this.showToast('Account created successfully!', 'success');
      this.router.navigateByUrl('tabs/home');
    } catch (error: any) {
      await loading.dismiss();
      if (!error.message.includes('closed')) {
        await this.showToast(error.message, 'danger');
      }
    }
  }

  async registerWithApple() {
    const loading = await this.loadingController.create({
      message: 'Signing up with Apple...'
    });
    await loading.present();

    try {
      const credential = await this.authService.loginWithApple();
      
      // Create user profile
      await this.userService.createUserProfile(credential.user.uid, credential.user.email!, {
        displayName: credential.user.displayName || '',
        photoURL: credential.user.photoURL || ''
      });
      
      await loading.dismiss();
      await this.showToast('Account created successfully!', 'success');
      this.router.navigateByUrl('tabs/home');
    } catch (error: any) {
      await loading.dismiss();
      if (!error.message.includes('closed')) {
        await this.showToast(error.message, 'danger');
      }
    }
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
