import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController, AlertController, ModalController } from '@ionic/angular';
import { AffiliateService } from '../../services/affiliate.service';
import { AuthService } from '../../services/auth.service';
import { PointsService } from '../../services/points.service';
import { AffiliatePartner, Offer, Redemption } from '../../models/affiliate.model';

@Component({
  selector: 'app-partners',
  templateUrl: './partners.page.html',
  styleUrls: ['./partners.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class PartnersPage implements OnInit {
  partners: AffiliatePartner[] = [];
  redemptions: Redemption[] = [];
  userPoints = 0;
  selectedCategory: string = 'all';
  selectedSegment = 'partners';
  isLoading = false;

  categories = [
    { value: 'all', label: 'All', icon: 'grid' },
    { value: 'retail', label: 'Retail', icon: 'cart' },
    { value: 'food', label: 'Food', icon: 'restaurant' },
    { value: 'transport', label: 'Transport', icon: 'bus' },
    { value: 'entertainment', label: 'Entertainment', icon: 'game-controller' },
    { value: 'health', label: 'Health', icon: 'fitness' },
    { value: 'education', label: 'Education', icon: 'school' }
  ];

  constructor(
    private affiliateService: AffiliateService,
    private authService: AuthService,
    private pointsService: PointsService,
    private toastController: ToastController,
    private alertController: AlertController
  ) {}

  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    this.isLoading = true;
    try {
      const user = await this.authService.getCurrentUser();
      if (user) {
        this.userPoints = await this.pointsService.getPoints(user.uid);
        this.partners = await this.affiliateService.getPartners() as any;
        this.redemptions = await this.affiliateService.getUserRedemptions(user.uid) as any;
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      this.isLoading = false;
    }
  }

  get filteredPartners(): AffiliatePartner[] {
    if (this.selectedCategory === 'all') {
      return this.partners.filter(p => p.active);
    }
    return this.partners.filter(p => p.active && p.category === this.selectedCategory);
  }

  segmentChanged(event: any) {
    this.selectedSegment = event.detail.value;
  }

  async redeemOffer(offer: Offer) {
    const partner = this.partners.find(p => p.id === offer.partnerId);
    if (!partner) return;

    if (this.userPoints < offer.pointsCost) {
      await this.showToast('Not enough points', 'danger');
      return;
    }

    const alert = await this.alertController.create({
      header: 'Redeem Offer',
      message: `Redeem ${offer.title} for ${offer.pointsCost} points?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Redeem',
          handler: async () => {
            await this.performRedemption(offer);
          }
        }
      ]
    });

    await alert.present();
  }

  async performRedemption(offer: Offer) {
    try {
      const user = await this.authService.getCurrentUser();
      if (!user) return;

      const redemption = await this.affiliateService.redeemOffer(user.uid, offer as any);
      this.userPoints -= offer.pointsCost;
      this.redemptions.unshift(redemption as any);

      const alert = await this.alertController.create({
        header: 'Success!',
        message: `Your redemption code: ${redemption.code}`,
        buttons: ['OK']
      });
      await alert.present();
    } catch (error) {
      console.error('Error redeeming offer:', error);
      await this.showToast('Failed to redeem offer', 'danger');
    }
  }

  canAfford(pointsCost: number): boolean {
    return this.userPoints >= pointsCost;
  }

  getRedemptionStatus(status: string): { color: string; icon: string } {
    const statusMap: Record<string, { color: string; icon: string }> = {
      active: { color: 'success', icon: 'checkmark-circle' },
      used: { color: 'medium', icon: 'checkmark-done' },
      expired: { color: 'danger', icon: 'close-circle' }
    };
    return statusMap[status] || statusMap['active'];
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
