import { Routes } from '@angular/router';
import { cuentaAuthGuard } from './guards/cuenta-auth.guard';

export const cuentaRoutes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/cuenta-login.component').then(m => m.CuentaLoginComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./pages/dashboard/cuenta-dashboard.component').then(m => m.CuentaDashboardComponent),
    canActivate: [cuentaAuthGuard]
  },
  {
    path: 'perfil',
    loadComponent: () =>
      import('./pages/perfil/cuenta-perfil.component').then(m => m.CuentaPerfilComponent),
    canActivate: [cuentaAuthGuard]
  },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
];
