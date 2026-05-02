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
    path: 'cocina',
    loadChildren: () =>
      import('./cocina/cocina.routes').then(m => m.cocinaRoutes)
  },
  {
    path: 'domicilio',
    loadChildren: () =>
      import('./domicilio/domicilio.routes').then(m => m.domicilioRoutes)
  },
  {
    path: 'seguimiento/:id',
    loadComponent: () =>
      import('./pages/seguimiento/seguimiento.component').then(m => m.SeguimientoComponent)
  },
  {
    path: 'privacidad',
    loadComponent: () =>
      import('./pages/privacidad/privacidad.component').then(m => m.PrivacidadComponent)
  },
  { path: '**', redirectTo: '' },
];
