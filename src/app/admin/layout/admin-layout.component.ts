import { Component, inject, signal } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AdminService } from '../services/admin.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="admin-shell">

      <!-- Topbar móvil -->
      <header class="topbar">
        <button class="hamburger" (click)="sidebarOpen.set(!sidebarOpen())">☰</button>
        <div class="topbar-brand">
          <img src="assets/logo.png" alt="CB" class="topbar-logo" />
          <span>CB Admin</span>
        </div>
      </header>

      <!-- Overlay -->
      @if (sidebarOpen()) {
        <div class="overlay" (click)="sidebarOpen.set(false)"></div>
      }

      <aside class="sidebar" [class.open]="sidebarOpen()">
        <div class="sidebar-brand">
          <img src="assets/logo.png" alt="Columbia Burger" class="sidebar-logo" />
          <div class="sidebar-brand-text">
            <span class="brand-name">Columbia</span>
            <span class="brand-sub">Burger Admin</span>
          </div>
        </div>

        <nav class="sidebar-nav">
          <a routerLink="/admin/dashboard" routerLinkActive="active" (click)="sidebarOpen.set(false)">
            <span class="nav-icon">📊</span>
            <span>Dashboard</span>
          </a>
          <a routerLink="/admin/pedidos" routerLinkActive="active" (click)="sidebarOpen.set(false)">
            <span class="nav-icon">📦</span>
            <span>Pedidos</span>
          </a>
          <a routerLink="/admin/clientes" routerLinkActive="active" (click)="sidebarOpen.set(false)">
            <span class="nav-icon">👥</span>
            <span>Clientes</span>
          </a>
          <a routerLink="/admin/mesero" routerLinkActive="active" (click)="sidebarOpen.set(false)">
            <span class="nav-icon">🧾</span>
            <span>Tomar Pedido</span>
          </a>
          <a routerLink="/admin/menu" routerLinkActive="active" (click)="sidebarOpen.set(false)">
            <span class="nav-icon">🍔</span>
            <span>Menú</span>
          </a>
        </nav>

        <button class="logout-btn" (click)="logout()">
          <span class="logout-icon">↩</span> Cerrar sesión
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

    /* Topbar — solo visible en móvil */
    .topbar {
      display: none;
      position: fixed;
      top: 0; left: 0; right: 0;
      height: 52px;
      background: #161b22;
      border-bottom: 1px solid #21262d;
      align-items: center;
      gap: 0.75em;
      padding: 0 1em;
      z-index: 200;
    }
    .hamburger {
      background: none;
      border: none;
      color: #c9d1d9;
      font-size: 1.3em;
      cursor: pointer;
      padding: 0.2em 0.4em;
    }
    .topbar-logo {
      width: 34px; height: 34px;
      object-fit: contain;
      border-radius: 8px;
      background: #fff;
      padding: 3px;
    }
    .topbar-brand {
      display: flex;
      align-items: center;
      gap: 0.5em;
      font-size: 1em;
      font-weight: 700;
      color: #e94560;
    }

    /* Overlay */
    .overlay {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.5);
      z-index: 150;
    }

    .sidebar {
      width: 220px;
      background: #161b22;
      border-right: 1px solid #21262d;
      display: flex;
      flex-direction: column;
      padding: 1.5em 0;
      position: fixed;
      top: 0; left: 0; bottom: 0;
      z-index: 160;
      transition: transform 0.25s ease;
    }
    .sidebar-brand {
      display: flex;
      align-items: center;
      gap: 0.75em;
      padding: 1em 1.25em 1.25em;
      border-bottom: 1px solid #21262d;
      margin-bottom: 0.75em;
    }
    .sidebar-logo {
      width: 48px; height: 48px;
      object-fit: contain;
      border-radius: 12px;
      background: #fff;
      padding: 5px;
      box-shadow: 0 2px 12px rgba(233,69,96,0.25);
      flex-shrink: 0;
    }
    .sidebar-brand-text {
      display: flex;
      flex-direction: column;
      line-height: 1.2;
    }
    .brand-name {
      color: #e6edf3;
      font-size: 0.95em;
      font-weight: 700;
    }
    .brand-sub {
      color: #8b949e;
      font-size: 0.72em;
    }
    .sidebar-nav {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.25em;
      padding: 0 0.75em;
    }
    .sidebar-nav a {
      display: flex;
      align-items: center;
      gap: 0.75em;
      padding: 0.7em 0.9em;
      border-radius: 10px;
      color: #8b949e;
      text-decoration: none;
      font-size: 0.88em;
      font-weight: 500;
      transition: all 0.18s;
    }
    .sidebar-nav a:hover { background: #21262d; color: #c9d1d9; }
    .sidebar-nav a.active {
      background: rgba(233,69,96,0.12);
      color: #e94560;
      box-shadow: inset 3px 0 0 #e94560;
    }
    .nav-icon { font-size: 1.05em; width: 1.4em; text-align: center; }
    .logout-btn {
      margin: 0 0.75em 0.5em;
      padding: 0.7em 0.9em;
      background: none;
      border: 1px solid #21262d;
      border-radius: 10px;
      color: #6e7681;
      font-size: 0.85em;
      cursor: pointer;
      text-align: left;
      transition: all 0.18s;
      display: flex;
      align-items: center;
      gap: 0.5em;
    }
    .logout-btn:hover { background: rgba(248,81,73,0.08); color: #f85149; border-color: rgba(248,81,73,0.3); }
    .logout-icon { font-size: 1em; }


    .admin-content {
      margin-left: 220px;
      flex: 1;
      padding: 2em;
      overflow-y: auto;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .topbar { display: flex; }
      .overlay { display: block; }
      .sidebar {
        transform: translateX(-100%);
        top: 0;
        padding-top: 52px;
      }
      .sidebar.open { transform: translateX(0); }
      .sidebar-brand { display: none; }
      .admin-content {
        margin-left: 0;
        padding: 1em;
        padding-top: calc(52px + 1em);
      }
    }
  `]
})
export class AdminLayoutComponent {
  private adminService = inject(AdminService);
  private router = inject(Router);

  sidebarOpen = signal(false);

  logout(): void {
    this.adminService.logout();
    this.router.navigate(['/admin/login']);
  }
}
