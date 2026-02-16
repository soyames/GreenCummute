import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-data-disclaimer',
  templateUrl: './data-disclaimer.component.html',
  styleUrls: ['./data-disclaimer.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class DataDisclaimerComponent {
  @Input() showFullDisclaimer: boolean = false;
  @Input() position: 'top' | 'bottom' | 'inline' = 'bottom';
  
  showDisclaimer: boolean = true;

  dismissDisclaimer() {
    this.showDisclaimer = false;
    localStorage.setItem('disclaimer_dismissed', 'true');
  }

  ngOnInit() {
    const dismissed = localStorage.getItem('disclaimer_dismissed');
    if (dismissed === 'true' && !this.showFullDisclaimer) {
      this.showDisclaimer = false;
    }
  }
}
