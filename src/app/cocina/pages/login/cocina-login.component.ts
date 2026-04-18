import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CocinaService } from '../../services/cocina.service';

@Component({
  selector: 'app-cocina-login',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="page">
      <div class="card">
        <img src="assets/logo.png" alt="Columbia Burger" class="logo" />
        <h1 class="title">Cocina</h1>
        <p class="sub">Columbia Burger</p>

        <form (ngSubmit)="login()" class="form">
          <div class="field">
            <label>Usuario</label>
            <input type="email" [(ngModel)]="email" name="email" placeholder="correo@ejemplo.com" autocomplete="username" />
          </div>
          <div class="field">
            <label>Contraseña</label>
            <input type="password" [(ngModel)]="password" name="password" placeholder="••••••••" autocomplete="current-password" />
          </div>

          @if (error()) {
            <p class="error">{{ error() }}</p>
          }

          <button type="submit" class="btn" [disabled]="loading()">
            {{ loading() ? 'Entrando...' : 'Entrar' }}
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .page {
      min-height: 100vh;
      background: #0d1117;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1em;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    .card {
      background: #161b22;
      border: 1px solid #21262d;
      border-radius: 16px;
      padding: 2.5em 2em;
      width: 100%;
      max-width: 360px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5em;
    }
    .logo {
      width: 72px; height: 72px;
      border-radius: 16px;
      background: #fff;
      padding: 6px;
      object-fit: contain;
      margin-bottom: 0.5em;
    }
    .title { font-size: 1.5em; font-weight: 700; color: #e6edf3; margin: 0; }
    .sub { font-size: 0.85em; color: #8b949e; margin: 0 0 1em; }
    .form { width: 100%; display: flex; flex-direction: column; gap: 1em; }
    .field { display: flex; flex-direction: column; gap: 0.4em; }
    .field label { font-size: 0.8em; color: #8b949e; font-weight: 600; }
    .field input {
      padding: 0.7em 1em;
      background: #0d1117;
      border: 1px solid #30363d;
      border-radius: 8px;
      color: #e6edf3;
      font-size: 0.9em;
      outline: none;
      transition: border-color 0.2s;
    }
    .field input:focus { border-color: #e94560; }
    .error { color: #f85149; font-size: 0.82em; margin: 0; text-align: center; }
    .btn {
      padding: 0.8em;
      background: #e94560;
      border: none;
      border-radius: 8px;
      color: #fff;
      font-size: 0.95em;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.2s;
      margin-top: 0.5em;
    }
    .btn:hover:not(:disabled) { background: #c73652; }
    .btn:disabled { opacity: 0.6; cursor: not-allowed; }
  `]
})
export class CocinaLoginComponent {
  private svc = inject(CocinaService);
  private router = inject(Router);

  email = '';
  password = '';
  loading = signal(false);
  error = signal<string | null>(null);

  login(): void {
    this.loading.set(true);
    this.error.set(null);
    this.svc.login({ email: this.email, password: this.password }).subscribe({
      next: () => this.router.navigate(['/cocina']),
      error: () => {
        this.error.set('Usuario o contraseña incorrectos');
        this.loading.set(false);
      }
    });
  }
}
