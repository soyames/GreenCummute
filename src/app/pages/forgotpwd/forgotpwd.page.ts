import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule, ToastController, LoadingController } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-forgotpwd',
  templateUrl: './forgotpwd.page.html',
  styleUrls: ['./forgotpwd.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, ReactiveFormsModule]
})
export class ForgotpwdPage implements OnInit {
  resetForm: FormGroup;
  isLoading = false;

  constructor(
    private router: Router,
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private toastController: ToastController,
    private loadingController: LoadingController
  ) {
    this.resetForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnInit() {}

  async resetPassword() {
    if (this.resetForm.invalid) {
      await this.showToast('Please enter a valid email address');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Sending reset email...'
    });
    await loading.present();

    try {
      const { email } = this.resetForm.value;
      await this.authService.resetPassword(email);
      
      await loading.dismiss();
      await this.showToast('Password reset email sent! Check your inbox.', 'success');
      this.router.navigateByUrl('loginscreen');
    } catch (error: any) {
      await loading.dismiss();
      await this.showToast(error.message, 'danger');
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
