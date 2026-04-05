import { Routes } from '@angular/router';
import { LandingPageComponent } from './pages/landing-page/landing-page.component';

export const routes: Routes = [
  { path: '', component: LandingPageComponent },
  {
    path: 'menu',
    loadComponent: () =>
      import('./pages/menu/menu-page.component').then((m) => m.MenuPageComponent),
  },
  { path: '**', redirectTo: '' },
];
