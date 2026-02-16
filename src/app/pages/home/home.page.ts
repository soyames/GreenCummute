import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { DataDisclaimerComponent } from '../../components/data-disclaimer/data-disclaimer.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, DataDisclaimerComponent]
})
export class HomePage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
