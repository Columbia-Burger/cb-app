import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="login-wrapper">
      <div class="login-card">
        <div class="login-logo">
          <span class="logo-icon">🍔</span>
          <h1>Columbia Burger</h1>
          <p>Panel Administrativo</p>
        </div>

        <form (ngSubmit)="onSubmit()">
          <div class="field">
            <label>Correo electrónico</label>
            <input
              type="email"
              [(ngModel)]="email"
              name="email"
              placeholder="admin@columbiaburger.com"
              required
              [disabled]="loading()"
            />
          </div>

          <div class="field">
            <label>Contraseña</label>
            <input
              type="password"
              [(ngModel)]="password"
              name="password"
              placeholder="••••••••"
              required
              [disabled]="loading()"
            />
          </div>

          @if (error()) {
            <div class="error-msg">{{ error() }}</div>
          }

          <button type="submit" [disabled]="loading()">
            @if (loading()) { Ingresando... } @else { Ingresar }
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .login-wrapper {
      min-height: 100vh;
      background: #1a1a2e;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }
    .login-card {
      background: #16213e;
      border: 1px solid #0f3460;
      border-radius: 16px;
      padding: 2.5rem;
      width: 100%;
      max-width: 400px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.4);
    }
    .login-logo {
      text-align: center;
      margin-bottom: 2rem;
    }
    .logo-icon { font-size: 2.5rem; }
    h1 {
      color: #e94560;
      font-size: 1.5rem;
      margin: 0.5rem 0 0.25rem;
    }
    p { color: #8892b0; font-size: 0.9rem; margin: 0; }
    .field {
      margin-bottom: 1.25rem;
    }
    label {
      display: block;
      color: #ccd6f6;
      font-size: 0.85rem;
      margin-bottom: 0.4rem;
    }
    input {
      width: 100%;
      padding: 0.75rem 1rem;
      background: #0f3460;
      border: 1px solid #1a4a7a;
      border-radius: 8px;
      color: #ccd6f6;
      font-size: 0.95rem;
      box-sizing: border-box;
      transition: border-color 0.2s;
    }
    input:focus {
      outline: none;
      border-color: #e94560;
    }
    input:disabled { opacity: 0.6; }
    .error-msg {
      background: rgba(233,69,96,0.15);
      border: 1px solid #e94560;
      color: #e94560;
      padding: 0.6rem 0.9rem;
      border-radius: 8px;
      font-size: 0.85rem;
      margin-bottom: 1rem;
    }
    button {
      width: 100%;
      padding: 0.85rem;
      background: #e94560;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }
    button:hover:not(:disabled) { background: #c73652; }
    button:disabled { opacity: 0.6; cursor: not-allowed; }
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
