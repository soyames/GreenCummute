import { Routes } from '@angular/router';
import { TabsPage } from './pages/tabs/tabs.page';
import { LoginPage } from './pages/login/login.page';

export const routes: Routes = [
  {
    path:'',
    redirectTo: 'login',
    pathMatch: 'full'

  },
   {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then( m => m.LoginPage)
  },
  {
    path: 'registration',
    loadComponent: () => import('./pages/registration/registration.page').then( m => m.RegistrationPage)
  },
  {
    path: 'forgotpwd',
    loadComponent: () => import('./pages/forgotpwd/forgotpwd.page').then( m => m.ForgotpwdPage)
  },
  {
    path: 'home',
    loadComponent: () => import('./pages/home/home.page').then( m => m.HomePage)
  },
  {
    path: 'loginscreen',
    loadComponent: () => import('./pages/loginscreen/loginscreen.page').then( m => m.LoginscreenPage)
  },
  {
    path: 'profile',
    loadComponent: () => import('./pages/profile/profile.page').then( m => m.ProfilePage)
  },
   {
    path: 'tabs',
    component: TabsPage,
    children:[
      {path:"home", loadChildren:() => import('src/app/pages/home/home.page').then(m => m.HomePage)},
      {path:"feeds", loadChildren:() => import ('src/app/pages/feeds/feeds.page').then( m => m.FeedsPage)},
      {path: "profile", loadChildren:() => import ('src/app/pages/profile/profile.page').then( m => m.ProfilePage)}
    ]
  },
];
