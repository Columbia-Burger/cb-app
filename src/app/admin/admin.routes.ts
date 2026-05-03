import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const adminRoutes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/admin-login.component').then(m => m.AdminLoginComponent)
  },
  {
    path: '',
    loadComponent: () =>
      import('./layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent)
      },
      {
        path: 'pedidos',
        loadComponent: () =>
          import('./pages/pedidos/admin-pedidos.component').then(m => m.AdminPedidosComponent)
      },
      {
        path: 'clientes',
        loadComponent: () =>
          import('./pages/clientes/admin-clientes.component').then(m => m.AdminClientesComponent)
      },
      {
        path: 'mesero',
        loadComponent: () =>
          import('./pages/mesero/admin-mesero.component').then(m => m.AdminMeseroComponent)
      },
      {
        path: 'menu',
        loadComponent: () =>
          import('./pages/menu/admin-menu.component').then(m => m.AdminMenuComponent)
      },
      {
        path: 'adiciones',
        loadComponent: () =>
          import('./pages/adiciones/admin-adiciones.component').then(m => m.AdminAdicionesComponent)
      },
      {
        path: 'zonas',
        loadComponent: () =>
          import('./pages/zonas/admin-zonas.component').then(m => m.AdminZonasComponent)
      },
      {
        path: 'reportes',
        loadComponent: () =>
          import('./pages/reportes/admin-reportes.component').then(m => m.AdminReportesComponent)
      },
      {
        path: 'facturas',
        loadComponent: () =>
          import('./pages/facturas/admin-facturas.component').then(m => m.AdminFacturasComponent)
      },
      {
        path: 'turno',
        loadComponent: () =>
          import('./pages/turno/admin-turno.component').then(m => m.AdminTurnoComponent)
      },
      {
        path: 'social',
        loadComponent: () =>
          import('./pages/social/admin-social.component').then(m => m.AdminSocialComponent)
      },
      {
        path: 'cupones',
        loadComponent: () =>
          import('./pages/cupones/admin-cupones.component').then(m => m.AdminCuponesComponent)
      }
    ]
  }
];
