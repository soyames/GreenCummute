import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { initializeApp } from 'firebase/app';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [IonicModule],
})
export class AppComponent {
  constructor() {
    // Initialize Firebase
    initializeApp(environment.firebase);
  }
}
