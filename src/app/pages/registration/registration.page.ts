import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { NavController, ToastController } from '@ionic/angular';
import 'firebase/auth';
import { FacebookAuthProvider, GoogleAuthProvider } from 'firebase/auth';



@Component({
  selector: 'app-registration',
  templateUrl: './registration.page.html',
  styleUrls: ['./registration.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class RegistrationPage implements OnInit {
  afAuth: any;

  constructor(/*public navCtrl: NavController,public toastCtrl: ToastController, private http: HttpClient*/private Router: Router) { }

  ngOnInit() {
  }
  
  async createUser() {

    this.Router.navigateByUrl('registration')
    // get the form data from the inputs
    /*
    const firstName = (document.querySelector('#firstName') as HTMLInputElement).value;
    const lastName = (document.querySelector('#lastName') as HTMLInputElement).value;
    const city = (document.querySelector('#city') as HTMLInputElement).value;
    const occupation = (document.querySelector('#occupation') as HTMLInputElement).value;
    const email = (document.querySelector('#email') as HTMLInputElement).value;
    const phoneNumber = (document.querySelector('#phoneNumber') as HTMLInputElement).value;
  
    // get the selected file
    const fileInput = document.querySelector('#profilePicture') as HTMLInputElement;
    const file = fileInput.files && fileInput.files.length > 0 ? fileInput.files[0] : null;
    if (!file) {
      const toast = await this.toastCtrl.create({
        message: 'Please select a profile picture.',
        duration: 3000
      });
      toast.present();
      return;
    }

// Do something with the selected file

    // perform validation on the form data and file
    if (!firstName || !lastName || !city || !occupation || !email || !phoneNumber || !file) {
      const toast = await this.toastCtrl.create({
        message: 'Please fill all the fields and select a profile picture.',
        duration: 3000
      });
      toast.present();
      return;
    }
  
    // prepare the form data to be sent to the server
    /*const formData = new FormData();
    formData.append('firstName', firstName);
    formData.append('lastName', lastName);
    formData.append('city', city);
    formData.append('occupation', occupation);
    formData.append('email', email);
    formData.append('phoneNumber', phoneNumber);
    formData.append('profilePicture', file);*/

     // prepare the request data
  /*const requestData = {
    firstName,
    lastName,
    city,
    occupation,
    email,
    phoneNumber
  };

*/
    // sign in with Google
 /* const googleProvider = new firebase.auth.GoogleAuthProvider();
  const googleCredential = await this.afAuth.signInWithPopup(googleProvider);
  console.log(googleCredential);

  // sign in with Facebook
  const facebookProvider = new firebase.auth.FacebookAuthProvider();
  const facebookCredential = await this.afAuth.signInWithPopup(facebookProvider);
  console.log(facebookCredential);

  // sign in with Apple
  const appleProvider = new firebase.auth.OAuthProvider('apple.com');
  const appleCredential = await this.afAuth.signInWithPopup(appleProvider);
  console.log(appleCredential);
*/
  


    // make an HTTP POST request to your backend API
    //this.http.post('https://my-backend-api.com/register', requestData /*formData*/).subscribe(response => {
      // handle the response from the backend
     // console.log(response);
  
      // navigate to the login page
     // this.navCtrl.navigateRoot('/login');
    //}, async error => {
      // handle any errors from the backend
     // console.error(error);
  
      // display a toast message to the user
      //const toast = this.toastCtrl.create({
      //  message: 'An error occurred. Please try again later.',
      //  duration: 3000
     // });
      //(await toast).present();
   // });
  }
/*
  navigateToGoogleLogin() {
    this.Router.navigate(['/google-login']);
  }
  */


}
