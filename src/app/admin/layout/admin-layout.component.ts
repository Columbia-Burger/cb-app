import { Component, inject } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AdminService } from '../services/admin.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="admin-shell">
      <aside class="sidebar">
        <div class="sidebar-brand">
          <span>🍔</span>
          <span class="brand-name">CB Admin</span>
        </div>

        <nav class="sidebar-nav">
          <a routerLink="/admin/dashboard" routerLinkActive="active">
            <span class="nav-icon">📊</span>
            <span>Dashboard</span>
          </a>
          <a routerLink="/admin/pedidos" routerLinkActive="active">
            <span class="nav-icon">📦</span>
            <span>Pedidos</span>
          </a>
          <a routerLink="/admin/clientes" routerLinkActive="active">
            <span class="nav-icon">👥</span>
            <span>Clientes</span>
          </a>
        </nav>

        <button class="logout-btn" (click)="logout()">
          <span>⬅️</span> Cerrar sesión
        </button>
      </aside>

      <main class="admin-content">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    .admin-shell {
      display: flex;
      min-height: 100vh;
      background: #0d1117;
    }
    .sidebar {
      width: 220px;
      background: #161b22;
      border-right: 1px solid #21262d;
      display: flex;
      flex-direction: column;
      padding: 1.5rem 0;
      position: fixed;
      top: 0; left: 0; bottom: 0;
    }
    .sidebar-brand {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      padding: 0 1.25rem 1.5rem;
      font-size: 1.2rem;
      font-weight: 700;
      color: #e94560;
      border-bottom: 1px solid #21262d;
      margin-bottom: 1rem;
    }
    .sidebar-nav {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      padding: 0 0.75rem;
    }
    .sidebar-nav a {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.7rem 0.75rem;
      border-radius: 8px;
      color: #8b949e;
      text-decoration: none;
      font-size: 0.9rem;
      transition: all 0.2s;
    }
    .sidebar-nav a:hover {
      background: #21262d;
      color: #c9d1d9;
    }
    .sidebar-nav a.active {
      background: rgba(233,69,96,0.15);
      color: #e94560;
    }
    .nav-icon { font-size: 1.1rem; }
    .logout-btn {
      margin: 0 0.75rem;
      padding: 0.7rem 0.75rem;
      background: none;
      border: 1px solid #21262d;
      border-radius: 8px;
      color: #8b949e;
      font-size: 0.85rem;
      cursor: pointer;
      text-align: left;
      transition: all 0.2s;
    }
    .logout-btn:hover {
      background: #21262d;
      color: #c9d1d9;
    }
    .admin-content {
      margin-left: 220px;
      flex: 1;
      padding: 2rem;
      overflow-y: auto;
    }
  `]
})
export class AdminLayoutComponent {
  private adminService = inject(AdminService);
  private router = inject(Router);

  logout(): void {
    this.adminService.logout();
    this.router.navigate(['/admin/login']);
  }
}
