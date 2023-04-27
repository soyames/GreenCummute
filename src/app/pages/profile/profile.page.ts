import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';
import { NavController } from '@ionic/angular';
import { Auth } from 'firebase/auth';
//import { AuthService } from 'ionic/angular';
@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class ProfilePage implements OnInit {
  firstName: string = '';
  lastName: string = '';
  city: string = '';
  occupation: string = '';
  email: string = '';
  phoneNumber: string = '';
  profilePictureUrl: string = '';
  authService: any;

  constructor(){}
   

  ngOnInit() {
    // Fetch the user's profile data from the backend
    this.authService.getProfile().subscribe((data: { firstName: string; lastName: string; city: string; occupation: string; email: string; phoneNumber: string; profilePictureUrl: string; }) => {
      this.firstName = data.firstName;
      this.lastName = data.lastName;
      this.city = data.city;
      this.occupation = data.occupation;
      this.email = data.email;
      this.phoneNumber = data.phoneNumber;
      this.profilePictureUrl = data.profilePictureUrl;
    });
  }

}
