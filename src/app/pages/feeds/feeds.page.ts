import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-feeds',
  templateUrl: './feeds.page.html',
  styleUrls: ['./feeds.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class FeedsPage {
  transports: any[] = [];

  constructor() {}

  ionViewDidEnter() {
    // Mock transport data
    this.transports = [
      { name: 'Bus 13A', departure: '10:30', destination: 'City Center' },
      { name: 'Train IC542', departure: '11:15', destination: 'Salzburg' },
    ];
  }
}