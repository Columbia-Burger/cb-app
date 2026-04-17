import { Component, inject, signal, OnInit } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AdminService } from '../services/admin.service';
import { ShiftResponse } from '../models/admin.model';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="admin-shell">

      <!-- Topbar móvil -->
      <header class="topbar">
        <button class="hamburger" (click)="sidebarOpen.set(!sidebarOpen())">☰</button>
        <span class="topbar-brand">🍔 CB Admin</span>
      </header>

      <!-- Overlay -->
      @if (sidebarOpen()) {
        <div class="overlay" (click)="sidebarOpen.set(false)"></div>
      }

      <aside class="sidebar" [class.open]="sidebarOpen()">
        <div class="sidebar-brand">
          <span>🍔</span>
          <span class="brand-name">CB Admin</span>
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
        </nav>

        <div class="shift-section">
          <div class="shift-status" [class.open]="shiftActive()">
            <span class="shift-dot"></span>
            {{ shiftActive() ? 'Turno abierto' : 'Turno cerrado' }}
          </div>
          @if (shiftActive()) {
            <button class="shift-btn close" (click)="closeShift()">Cerrar turno</button>
          } @else {
            <button class="shift-btn open" (click)="openShift()">Abrir turno</button>
          }
        </div>

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
    .topbar-brand {
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
      gap: 0.6em;
      padding: 0 1.25em 1.5em;
      font-size: 1.2em;
      font-weight: 700;
      color: #e94560;
      border-bottom: 1px solid #21262d;
      margin-bottom: 1em;
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
      padding: 0.7em 0.75em;
      border-radius: 8px;
      color: #8b949e;
      text-decoration: none;
      font-size: 0.9em;
      transition: all 0.2s;
    }
    .sidebar-nav a:hover { background: #21262d; color: #c9d1d9; }
    .sidebar-nav a.active { background: rgba(233,69,96,0.15); color: #e94560; }
    .nav-icon { font-size: 1.1em; }
    .logout-btn {
      margin: 0 0.75em;
      padding: 0.7em 0.75em;
      background: none;
      border: 1px solid #21262d;
      border-radius: 8px;
      color: #8b949e;
      font-size: 0.85em;
      cursor: pointer;
      text-align: left;
      transition: all 0.2s;
    }
    .logout-btn:hover { background: #21262d; color: #c9d1d9; }
    .shift-section {
      margin: 0 0.75em 1em;
      padding: 0.75em;
      background: #0d1117;
      border: 1px solid #21262d;
      border-radius: 8px;
    }
    .shift-status {
      display: flex;
      align-items: center;
      gap: 0.5em;
      font-size: 0.78em;
      color: #8b949e;
      margin-bottom: 0.5em;
    }
    .shift-dot {
      width: 8px; height: 8px;
      border-radius: 50%;
      background: #f85149;
      flex-shrink: 0;
    }
    .shift-status.open .shift-dot { background: #3fb950; }
    .shift-status.open { color: #3fb950; }
    .shift-btn {
      width: 100%;
      padding: 0.5em;
      border-radius: 6px;
      font-size: 0.8em;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: opacity 0.2s;
    }
    .shift-btn:hover { opacity: 0.85; }
    .shift-btn.open { background: #3fb950; color: #0d1117; }
    .shift-btn.close { background: #f85149; color: #fff; }

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
export class AdminLayoutComponent implements OnInit {
  private adminService = inject(AdminService);
  private router = inject(Router);

  sidebarOpen = signal(false);
  shiftActive = signal(false);
  shift = signal<ShiftResponse | null>(null);

  ngOnInit(): void {
    this.adminService.getCurrentShift().subscribe(res => {
      if ('active' in res && res.active) {
        this.shift.set(res as ShiftResponse);
        this.shiftActive.set(true);
      }
    });
  }

  openShift(): void {
    this.adminService.openShift().subscribe(s => {
      this.shift.set(s);
      this.shiftActive.set(true);
    });
  }

  closeShift(): void {
    this.adminService.closeShift().subscribe(s => {
      this.shift.set(s);
      this.shiftActive.set(false);
    });
  }

  logout(): void {
    this.adminService.logout();
    this.router.navigate(['/admin/login']);
  }
}
