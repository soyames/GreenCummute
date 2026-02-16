// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  firebase: {
    apiKey: 'AIzaSyCq8GCVKAKRQQai79FB9IG4gs_ri-6lw4o',
    authDomain: 'greencommute-ad190.firebaseapp.com',
    projectId: 'greencommute-ad190',
    storageBucket: 'greencommute-ad190.firebasestorage.app',
    messagingSenderId: '823121594952',
    appId: '1:823121594952:web:0d0044133bfa434677a67d',
    measurementId: 'G-N7JSCB4E6R'
  },
  useLocalStorage: true, // Data stored on device, not cloud
  googleMapsApiKey: '', // Optional
  oebbApi: {
    baseUrl: 'https://scotty.oebb.at/bin/rest/',
    apiKey: ''
  }
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
