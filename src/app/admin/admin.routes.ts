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
      }
    ]
  }
];
