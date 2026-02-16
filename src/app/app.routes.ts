import { Routes } from '@angular/router';
import { TabsPage } from './pages/tabs/tabs.page';
import { authGuard } from './guards/auth.guard';

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
    path: 'loginscreen',
    loadComponent: () => import('./pages/loginscreen/loginscreen.page').then( m => m.LoginscreenPage)
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
    path: 'tabs',
    component: TabsPage,
    canActivate: [authGuard],
    children:[
      {
        path: 'home', 
        loadComponent: () => import('./pages/home/home.page').then(m => m.HomePage)
      },
      {
        path: 'navigation', 
        loadComponent: () => import('./pages/navigation/navigation.page').then(m => m.NavigationPage)
      },
      {
        path: 'points', 
        loadComponent: () => import('./pages/points/points.page').then(m => m.PointsPage)
      },
      {
        path: 'leaderboard', 
        loadComponent: () => import('./pages/leaderboard/leaderboard.page').then(m => m.LeaderboardPage)
      },
      {
        path: 'partners', 
        loadComponent: () => import('./pages/partners/partners.page').then(m => m.PartnersPage)
      },
      {
        path: 'statistics', 
        loadComponent: () => import('./pages/statistics/statistics.page').then(m => m.StatisticsPage)
      },
      {
        path: 'achievements', 
        loadComponent: () => import('./pages/achievements/achievements.page').then(m => m.AchievementsPage)
      },
      {
        path: 'route-history', 
        loadComponent: () => import('./pages/route-history/route-history.page').then(m => m.RouteHistoryPage)
      },
      {
        path: 'settings', 
        loadComponent: () => import('./pages/settings/settings.page').then(m => m.SettingsPage)
      },
      {
        path: 'feeds', 
        loadComponent: () => import('./pages/feeds/feeds.page').then( m => m.FeedsPage)
      },
      {
        path: 'profile', 
        loadComponent: () => import('./pages/profile/profile.page').then( m => m.ProfilePage)
      },
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: 'home',
    redirectTo: 'tabs/home',
    pathMatch: 'full'
  },
  {
    path: 'profile',
    redirectTo: 'tabs/profile',
    pathMatch: 'full'
  }
];
