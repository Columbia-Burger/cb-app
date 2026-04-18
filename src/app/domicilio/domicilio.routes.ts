import { Routes } from '@angular/router';
import { domicilioAuthGuard } from './guards/domicilio-auth.guard';

export const domicilioRoutes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/domicilio-login.component').then(m => m.DomicilioLoginComponent)
  },
  {
    path: '',
    loadComponent: () =>
      import('./pages/board/domicilio-board.component').then(m => m.DomicilioBoardComponent),
    canActivate: [domicilioAuthGuard]
  }
];
