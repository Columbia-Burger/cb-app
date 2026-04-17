import { Component, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { CuentaService, CustomerProfile } from '../../services/cuenta.service';

@Component({
  selector: 'app-cuenta-perfil',
  standalone: true,
  imports: [DatePipe],
  template: `
    <div class="shell">
      <!-- Header -->
      <header class="topbar">
        <div class="brand">
          <img src="assets/logo.png" alt="CB" class="topbar-logo" />
          <span>Columbia Burger</span>
        </div>
        <div class="nav-links">
          <a (click)="goTo('dashboard')" class="nav-link">Mis pedidos</a>
          <a (click)="goTo('perfil')" class="nav-link active">Mi perfil</a>
          <button class="btn-logout" (click)="logout()">Salir</button>
        </div>
      </header>

      <main class="content">
        <h2 class="page-title">Mi perfil</h2>

        @if (loading()) {
          <div class="loading-wrap">
            <div class="spinner"></div>
          </div>
        }

        @if (error()) {
          <p class="error">{{ error() }}</p>
        }

        @if (profile()) {
          <div class="profile-card">
            <div class="avatar">{{ initials() }}</div>
            <div class="profile-fields">
              <div class="field">
                <span class="field-label">Nombre</span>
                <span class="field-value">{{ profile()!.name || '—' }}</span>
              </div>
              <div class="field">
                <span class="field-label">WhatsApp</span>
                <span class="field-value">+{{ profile()!.whatsapp }}</span>
              </div>
              <div class="field">
                <span class="field-label">Barrio</span>
                <span class="field-value">{{ profile()!.neighborhood || '—' }}</span>
              </div>
              <div class="field">
                <span class="field-label">Dirección</span>
                <span class="field-value">{{ profile()!.address || '—' }}</span>
              </div>
              <div class="field">
                <span class="field-label">Cliente desde</span>
                <span class="field-value">{{ profile()!.createdAt | date:'MMM yyyy' }}</span>
              </div>
            </div>
          </div>

          <p class="hint">Para actualizar tus datos escríbenos por WhatsApp.</p>
        }
      </main>
    </div>
  `,
  styles: [`
    * { box-sizing: border-box; }
    .shell { min-height: 100vh; background: #0d1117; color: #e6edf3; font-family: system-ui, sans-serif; }

    .topbar {
      background: #161b22;
      border-bottom: 1px solid #21262d;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.85em 1.5em;
      position: sticky;
      top: 0;
      z-index: 10;
    }
    .topbar-logo { width: 30px; height: 30px; object-fit: contain; border-radius: 8px; }
    .brand { color: #e94560; font-weight: 700; font-size: 1.05em; display: flex; align-items: center; gap: 0.5em; }
    .nav-links { display: flex; align-items: center; gap: 1em; }
    .nav-link { color: #8b949e; font-size: 0.9em; cursor: pointer; text-decoration: none; padding: 0.25em 0; border-bottom: 2px solid transparent; transition: color 0.2s; }
    .nav-link:hover, .nav-link.active { color: #e6edf3; border-bottom-color: #e94560; }
    .btn-logout { background: none; border: 1px solid #30363d; color: #8b949e; border-radius: 6px; padding: 0.4em 0.9em; font-size: 0.85em; cursor: pointer; transition: all 0.2s; }
    .btn-logout:hover { border-color: #f85149; color: #f85149; }

    .content { max-width: 500px; margin: 0 auto; padding: 2em 1em; }
    .page-title { font-size: 1.3em; font-weight: 600; margin: 0 0 1.5em; }

    .loading-wrap { text-align: center; padding: 3em; }
    .spinner { width: 36px; height: 36px; border: 3px solid #30363d; border-top-color: #e94560; border-radius: 50%; animation: spin 0.7s linear infinite; margin: 0 auto; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .error { color: #f85149; text-align: center; padding: 2em; }

    .profile-card {
      background: #161b22;
      border: 1px solid #21262d;
      border-radius: 16px;
      padding: 2em 1.5em;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1.75em;
    }
    .avatar {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: #e94560;
      color: #fff;
      font-size: 1.6em;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .profile-fields { width: 100%; display: flex; flex-direction: column; gap: 1.1em; }
    .field { display: flex; justify-content: space-between; align-items: baseline; padding-bottom: 0.85em; border-bottom: 1px solid #21262d; }
    .field:last-child { border-bottom: none; padding-bottom: 0; }
    .field-label { color: #8b949e; font-size: 0.82em; text-transform: uppercase; letter-spacing: 0.05em; }
    .field-value { color: #e6edf3; font-size: 0.95em; font-weight: 500; }

    .hint { color: #6e7681; font-size: 0.8em; text-align: center; margin-top: 1.5em; }
  `]
})
export class CuentaPerfilComponent implements OnInit {
  private svc = inject(CuentaService);
  private router = inject(Router);

  profile = signal<CustomerProfile | null>(null);
  loading = signal(true);
  error = signal('');

  ngOnInit(): void {
    this.svc.getProfile().subscribe({
      next: p => {
        this.profile.set(p);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Error al cargar tu perfil.');
        this.loading.set(false);
      }
    });
  }

  initials(): string {
    const name = this.profile()?.name ?? '';
    return name
      .split(' ')
      .slice(0, 2)
      .map(w => w[0]?.toUpperCase() ?? '')
      .join('') || '?';
  }

  goTo(page: string): void {
    this.router.navigate(['/cuenta', page]);
  }

  logout(): void {
    this.svc.logout();
    this.router.navigate(['/cuenta/login']);
  }
}
