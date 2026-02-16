// This is an example configuration file
// Copy this to environment.ts and environment.prod.ts with your actual Firebase credentials
export const environment = {
  production: false,
  firebase: {
    apiKey: 'YOUR_API_KEY',
    authDomain: 'YOUR_PROJECT_ID.firebaseapp.com',
    projectId: 'YOUR_PROJECT_ID',
    storageBucket: 'YOUR_PROJECT_ID.appspot.com',
    messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
    appId: 'YOUR_APP_ID',
    measurementId: 'YOUR_MEASUREMENT_ID'
  },
  googleMapsApiKey: 'YOUR_GOOGLE_MAPS_API_KEY',
  oebbApi: {
    baseUrl: 'https://scotty.oebb.at/bin/rest/',
    apiKey: '' // OEBB API doesn't require key for basic usage
  }
};
