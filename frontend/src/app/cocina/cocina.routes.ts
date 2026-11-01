import { Routes } from '@angular/router';
import { cocinaAuthGuard } from './guards/cocina-auth.guard';

export const cocinaRoutes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/cocina-login.component').then(m => m.CocinaLoginComponent)
  },
  {
    path: '',
    loadComponent: () =>
      import('./pages/board/cocina-board.component').then(m => m.CocinaBoardComponent),
    canActivate: [cocinaAuthGuard]
  }
];
