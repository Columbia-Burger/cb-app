import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CuentaService } from '../../services/cuenta.service';

type Step = 'phone' | 'code';

@Component({
  selector: 'app-cuenta-login',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="login-shell">
      <div class="login-card">
        <div class="logo">🍔</div>
        <h1 class="brand">Columbia Burger</h1>
        <p class="subtitle">Portal de clientes</p>

        @if (step() === 'phone') {
          <div class="form-group">
            <label>Tu número de WhatsApp</label>
            <div class="phone-input">
              <span class="prefix">+57</span>
              <input
                type="tel"
                [(ngModel)]="phone"
                placeholder="3001234567"
                maxlength="10"
                (keydown.enter)="sendOtp()"
              />
            </div>
            <p class="hint">Te enviaremos un código de verificación</p>
          </div>
          <button class="btn-primary" (click)="sendOtp()" [disabled]="loading()">
            {{ loading() ? 'Enviando...' : 'Enviar código' }}
          </button>
        }

        @if (step() === 'code') {
          <div class="form-group">
            <label>Código de verificación</label>
            <input
              type="text"
              [(ngModel)]="code"
              placeholder="000000"
              maxlength="6"
              class="code-input"
              (keydown.enter)="verifyOtp()"
            />
            <p class="hint">Código enviado a +57{{ phone }}</p>
          </div>
          <button class="btn-primary" (click)="verifyOtp()" [disabled]="loading()">
            {{ loading() ? 'Verificando...' : 'Ingresar' }}
          </button>
          <button class="btn-link" (click)="step.set('phone')">← Cambiar número</button>
        }

        @if (error()) {
          <p class="error">{{ error() }}</p>
        }
      </div>
    </div>
  `,
  styles: [`
    .login-shell {
      min-height: 100vh;
      background: #0d1117;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1em;
    }
    .login-card {
      background: #161b22;
      border: 1px solid #21262d;
      border-radius: 16px;
      padding: 2.5em 2em;
      width: 100%;
      max-width: 380px;
      text-align: center;
    }
    .logo { font-size: 2.5em; margin-bottom: 0.25em; }
    .brand { color: #e94560; font-size: 1.4em; font-weight: 700; margin: 0 0 0.25em; }
    .subtitle { color: #8b949e; font-size: 0.9em; margin: 0 0 2em; }
    .form-group { text-align: left; margin-bottom: 1.25em; }
    label { display: block; font-size: 0.82em; color: #8b949e; margin-bottom: 0.5em; text-transform: uppercase; letter-spacing: 0.05em; }
    .phone-input { display: flex; align-items: center; border: 1px solid #30363d; border-radius: 8px; overflow: hidden; background: #0d1117; }
    .prefix { padding: 0.75em 0.75em; color: #8b949e; font-size: 0.9em; border-right: 1px solid #30363d; }
    input { width: 100%; padding: 0.75em; background: transparent; border: none; color: #e6edf3; font-size: 0.95em; outline: none; }
    .code-input { width: 100%; padding: 0.75em; background: #0d1117; border: 1px solid #30363d; border-radius: 8px; color: #e6edf3; font-size: 1.4em; letter-spacing: 0.5em; text-align: center; outline: none; box-sizing: border-box; }
    .code-input:focus { border-color: #e94560; }
    .hint { font-size: 0.78em; color: #8b949e; margin: 0.4em 0 0; }
    .btn-primary {
      width: 100%; padding: 0.85em; background: #e94560; border: none; border-radius: 8px;
      color: #fff; font-size: 0.95em; font-weight: 600; cursor: pointer; transition: opacity 0.2s;
    }
    .btn-primary:hover:not(:disabled) { opacity: 0.88; }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-link { background: none; border: none; color: #8b949e; font-size: 0.85em; cursor: pointer; margin-top: 0.75em; }
    .btn-link:hover { color: #c9d1d9; }
    .error { color: #f85149; font-size: 0.85em; margin-top: 0.75em; }
  `]
})
export class CuentaLoginComponent {
  private cuentaService = inject(CuentaService);
  private router = inject(Router);

  step = signal<Step>('phone');
  loading = signal(false);
  error = signal('');
  phone = '';
  code = '';

  sendOtp(): void {
    const whatsapp = '57' + this.phone.trim();
    if (this.phone.trim().length < 10) {
      this.error.set('Ingresa un número válido de 10 dígitos');
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.cuentaService.sendOtp(whatsapp).subscribe({
      next: () => {
        this.step.set('code');
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Error al enviar el código. Intenta de nuevo.');
        this.loading.set(false);
      }
    });
  }

  verifyOtp(): void {
    const whatsapp = '57' + this.phone.trim();
    this.loading.set(true);
    this.error.set('');
    this.cuentaService.verifyOtp(whatsapp, this.code.trim()).subscribe({
      next: () => this.router.navigate(['/cuenta/dashboard']),
      error: () => {
        this.error.set('Código incorrecto o expirado.');
        this.loading.set(false);
      }
    });
  }
}
