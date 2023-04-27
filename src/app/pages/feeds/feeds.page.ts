import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';
import axios from 'axios';


@Component({
  selector: 'app-feeds',
  templateUrl: './feeds.page.html',
  styleUrls: ['./feeds.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class FeedsPage {
  transports: any[] = [];

  constructor(private http: HttpClient) {}

  ionViewDidEnter() {
    // Fetch public transport data from ÖBB API
    this.http.get<any>('https://fahrplan.oebb.at/bin/stboard.exe/dn', {
      params: {
        L: 'vs_json',
        start: 'yes',
        selectDate: 'today',
        input: 'Wien Hbf',
      },
    }).subscribe(res => {
      this.transports = res.jnyL.map((journey: { prodX: any; date: string; time: string; stop: { dName: any; }; }) => ({
        name: journey.prodX,
        departure: journey.date + ' ' + journey.time,
        destination: journey.stop.dName,
      }));
    });
  }
}