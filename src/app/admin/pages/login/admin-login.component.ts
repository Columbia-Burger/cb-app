import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="shell">
      <!-- Left panel -->
      <div class="brand-panel">
        <img src="assets/logo.png" alt="Columbia Burger" class="brand-logo" />
        <h1 class="brand-name">Columbia Burger</h1>
        <p class="brand-sub">Panel Administrativo</p>
        <div class="brand-decor"></div>
      </div>

      <!-- Right panel -->
      <div class="form-panel">
        <div class="form-card">
          <img src="assets/logo.png" alt="Columbia Burger" class="mobile-logo" />
          <div class="form-header">
            <h2>Bienvenido</h2>
            <p>Ingresa tus credenciales para continuar</p>
          </div>

          <form (ngSubmit)="onSubmit()" autocomplete="off">
            <div class="field">
              <label for="email">Correo electrónico</label>
              <div class="input-wrap">
                <span class="input-icon">✉</span>
                <input
                  id="email"
                  type="email"
                  [(ngModel)]="email"
                  name="email"
                  placeholder="admin@columbiaburger.com"
                  required
                  [disabled]="loading()"
                />
              </div>
            </div>

            <div class="field">
              <label for="password">Contraseña</label>
              <div class="input-wrap">
                <span class="input-icon">🔒</span>
                <input
                  id="password"
                  type="password"
                  [(ngModel)]="password"
                  name="password"
                  placeholder="••••••••"
                  required
                  [disabled]="loading()"
                />
              </div>
            </div>

            @if (error()) {
              <div class="error-msg">{{ error() }}</div>
            }

            <button type="submit" [disabled]="loading()" class="btn-submit">
              @if (loading()) {
                <span class="spinner"></span> Ingresando...
              } @else {
                Ingresar
              }
            </button>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    * { box-sizing: border-box; margin: 0; padding: 0; }

    .shell {
      min-height: 100vh;
      display: flex;
      font-family: system-ui, -apple-system, sans-serif;
      background: #0d1117;
    }

    /* ── Brand panel ── */
    .brand-panel {
      display: none;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 45%;
      background: linear-gradient(145deg, #1a0a10 0%, #0d1117 40%, #1a0510 100%);
      border-right: 1px solid #21262d;
      padding: 3em;
      position: relative;
      overflow: hidden;
    }
    .brand-panel::before {
      content: '';
      position: absolute;
      width: 400px; height: 400px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(233,69,96,0.12) 0%, transparent 70%);
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
    }
    .brand-logo {
      width: 150px;
      height: 150px;
      object-fit: contain;
      border-radius: 28px;
      background: #fff;
      padding: 12px;
      box-shadow: 0 8px 40px rgba(233,69,96,0.3);
      margin-bottom: 1.5em;
      position: relative;
      z-index: 1;
    }
    .brand-name {
      color: #e6edf3;
      font-size: 1.8em;
      font-weight: 800;
      letter-spacing: -0.02em;
      position: relative;
      z-index: 1;
    }
    .brand-sub {
      color: #8b949e;
      font-size: 0.95em;
      margin-top: 0.4em;
      position: relative;
      z-index: 1;
    }
    .brand-decor {
      position: absolute;
      bottom: -60px; right: -60px;
      width: 200px; height: 200px;
      border-radius: 50%;
      border: 1px solid rgba(233,69,96,0.15);
    }

    /* ── Form panel ── */
    .form-panel {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2em 1.5em;
    }

    .form-card {
      width: 100%;
      max-width: 400px;
    }

    .form-header {
      margin-bottom: 2em;
    }
    .form-header h2 {
      color: #e6edf3;
      font-size: 1.6em;
      font-weight: 700;
      margin-bottom: 0.3em;
    }
    .form-header p {
      color: #8b949e;
      font-size: 0.9em;
    }

    /* Mobile logo */
    .mobile-logo {
      display: block;
      width: 88px; height: 88px;
      object-fit: contain;
      border-radius: 20px;
      background: #fff;
      padding: 10px;
      margin: 0 auto 1.5em;
      box-shadow: 0 4px 20px rgba(233,69,96,0.25);
    }

    /* Fields */
    .field { margin-bottom: 1.25em; }
    label {
      display: block;
      color: #8b949e;
      font-size: 0.78em;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin-bottom: 0.5em;
    }
    .input-wrap {
      display: flex;
      align-items: center;
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 10px;
      overflow: hidden;
      transition: border-color 0.2s;
    }
    .input-wrap:focus-within { border-color: #e94560; }
    .input-icon {
      padding: 0 0.85em;
      font-size: 0.95em;
      color: #6e7681;
    }
    input {
      flex: 1;
      padding: 0.8em 0.85em 0.8em 0;
      background: transparent;
      border: none;
      color: #e6edf3;
      font-size: 0.95em;
      outline: none;
    }
    input::placeholder { color: #484f58; }
    input:disabled { opacity: 0.5; }

    .error-msg {
      background: rgba(248,81,73,0.1);
      border: 1px solid rgba(248,81,73,0.4);
      color: #f85149;
      padding: 0.7em 1em;
      border-radius: 8px;
      font-size: 0.85em;
      margin-bottom: 1.25em;
    }

    .btn-submit {
      width: 100%;
      padding: 0.9em;
      background: #e94560;
      color: #fff;
      border: none;
      border-radius: 10px;
      font-size: 0.95em;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5em;
      letter-spacing: 0.02em;
    }
    .btn-submit:hover:not(:disabled) {
      background: #d63d58;
      transform: translateY(-1px);
      box-shadow: 0 4px 16px rgba(233,69,96,0.35);
    }
    .btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }

    .spinner {
      width: 16px; height: 16px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    @media (min-width: 768px) {
      .brand-panel { display: flex; }
      .mobile-logo { display: none; }
    }
  `]
})
export class AdminLoginComponent {
  private adminService = inject(AdminService);
  private router = inject(Router);

  email = '';
  password = '';
  loading = signal(false);
  error = signal('');

  onSubmit(): void {
    if (!this.email || !this.password) return;
    this.loading.set(true);
    this.error.set('');
    this.adminService.login({ email: this.email, password: this.password }).subscribe({
      next: () => this.router.navigate(['/admin/dashboard']),
      error: () => {
        this.error.set('Credenciales inválidas. Verifica tu correo y contraseña.');
        this.loading.set(false);
      }
    });
  }
}
