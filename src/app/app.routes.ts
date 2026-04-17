import { Routes } from '@angular/router';
import { LandingPageComponent } from './pages/landing-page/landing-page.component';

export const routes: Routes = [
  { path: '', component: LandingPageComponent },
  {
    path: 'menu',
    loadComponent: () =>
      import('./pages/menu/menu-page.component').then((m) => m.MenuPageComponent),
  },
  {
    path: 'admin',
    loadChildren: () =>
      import('./admin/admin.routes').then(m => m.adminRoutes)
  },
  {
    path: 'cuenta',
    loadChildren: () =>
      import('./cuenta/cuenta.routes').then(m => m.cuentaRoutes)
  },
  {
    path: 'seguimiento/:id',
    loadComponent: () =>
      import('./pages/seguimiento/seguimiento.component').then(m => m.SeguimientoComponent)
  },
  { path: '**', redirectTo: '' },
];
