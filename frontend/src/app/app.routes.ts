import { Routes } from '@angular/router';
import { LandingPageComponent } from './pages/landing-page/landing-page.component';
import { environment } from '../environments/environment';

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
  // Con el portal apagado, los enlaces viejos a /cuenta llevan al inicio
  environment.customerPortalEnabled
    ? {
        path: 'cuenta',
        loadChildren: () =>
          import('./cuenta/cuenta.routes').then(m => m.cuentaRoutes)
      }
    : { path: 'cuenta', redirectTo: '', pathMatch: 'prefix' },
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
