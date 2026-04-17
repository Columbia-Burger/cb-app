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
    <div class="shell">
      <div class="card">
        <!-- Header -->
        <div class="card-header">
          <img src="assets/logo.png" alt="Columbia Burger" class="logo" />
          <h1 class="brand">Columbia Burger</h1>
          <p class="subtitle">Portal de clientes</p>
        </div>

        <!-- Step indicator -->
        <div class="steps">
          <div class="step" [class.done]="step() === 'code'">
            <span class="step-dot">{{ step() === 'code' ? '✓' : '1' }}</span>
            <span>Teléfono</span>
          </div>
          <div class="step-line"></div>
          <div class="step" [class.active]="step() === 'code'">
            <span class="step-dot">2</span>
            <span>Código</span>
          </div>
        </div>

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
                autofocus
              />
            </div>
            <p class="hint">Te enviaremos un código de verificación por WhatsApp</p>
          </div>
          <button class="btn-primary" (click)="sendOtp()" [disabled]="loading()">
            @if (loading()) { <span class="spinner"></span> Enviando... } @else { Enviar código →}
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
              autofocus
            />
            <p class="hint">Código enviado a +57 {{ phone }}</p>
          </div>
          <button class="btn-primary" (click)="verifyOtp()" [disabled]="loading()">
            @if (loading()) { <span class="spinner"></span> Verificando... } @else { Ingresar →}
          </button>
          <button class="btn-link" (click)="step.set('phone')">← Cambiar número</button>
        }

        @if (error()) {
          <p class="error-msg">{{ error() }}</p>
        }
      </div>
    </div>
  `,
  styles: [`
    * { box-sizing: border-box; }
    .shell {
      min-height: 100vh;
      background: #0d1117;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5em 1em;
      font-family: system-ui, -apple-system, sans-serif;
    }
    .card {
      background: #161b22;
      border: 1px solid #21262d;
      border-radius: 20px;
      padding: 2.5em 2em;
      width: 100%;
      max-width: 390px;
      box-shadow: 0 24px 64px rgba(0,0,0,0.4);
    }
    .card-header { text-align: center; margin-bottom: 2em; }
    .logo {
      width: 72px; height: 72px;
      object-fit: contain;
      border-radius: 18px;
      box-shadow: 0 4px 20px rgba(233,69,96,0.3);
      margin-bottom: 0.75em;
    }
    .brand { color: #e6edf3; font-size: 1.3em; font-weight: 800; margin: 0 0 0.2em; letter-spacing: -0.01em; }
    .subtitle { color: #8b949e; font-size: 0.85em; margin: 0; }

    /* Steps */
    .steps {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5em;
      margin-bottom: 2em;
    }
    .step {
      display: flex;
      align-items: center;
      gap: 0.4em;
      font-size: 0.78em;
      color: #484f58;
      font-weight: 500;
    }
    .step.active { color: #e94560; }
    .step.done { color: #3fb950; }
    .step-dot {
      width: 22px; height: 22px;
      border-radius: 50%;
      background: #21262d;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75em;
      font-weight: 700;
    }
    .step.active .step-dot { background: rgba(233,69,96,0.2); color: #e94560; }
    .step.done .step-dot { background: rgba(63,185,80,0.2); color: #3fb950; }
    .step-line { flex: 1; max-width: 40px; height: 1px; background: #21262d; }

    /* Form */
    .form-group { margin-bottom: 1.25em; }
    label {
      display: block;
      font-size: 0.75em;
      color: #8b949e;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin-bottom: 0.6em;
    }
    .phone-input {
      display: flex;
      align-items: center;
      background: #0d1117;
      border: 1px solid #30363d;
      border-radius: 10px;
      overflow: hidden;
      transition: border-color 0.2s;
    }
    .phone-input:focus-within { border-color: #e94560; }
    .prefix {
      padding: 0.8em 0.85em;
      color: #8b949e;
      font-size: 0.9em;
      border-right: 1px solid #30363d;
      background: #161b22;
      font-weight: 600;
    }
    input {
      flex: 1;
      padding: 0.8em 0.85em;
      background: transparent;
      border: none;
      color: #e6edf3;
      font-size: 0.95em;
      outline: none;
    }
    .code-input {
      width: 100%;
      padding: 0.85em;
      background: #0d1117;
      border: 1px solid #30363d;
      border-radius: 10px;
      color: #e6edf3;
      font-size: 1.6em;
      letter-spacing: 0.6em;
      text-align: center;
      outline: none;
      transition: border-color 0.2s;
    }
    .code-input:focus { border-color: #e94560; }
    .hint { font-size: 0.78em; color: #6e7681; margin: 0.5em 0 0; }

    .btn-primary {
      width: 100%;
      padding: 0.9em;
      background: #e94560;
      border: none;
      border-radius: 10px;
      color: #fff;
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
    .btn-primary:hover:not(:disabled) {
      background: #d63d58;
      transform: translateY(-1px);
      box-shadow: 0 4px 16px rgba(233,69,96,0.35);
    }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-link {
      display: block;
      width: 100%;
      background: none;
      border: none;
      color: #8b949e;
      font-size: 0.85em;
      cursor: pointer;
      margin-top: 0.9em;
      text-align: center;
      transition: color 0.2s;
    }
    .btn-link:hover { color: #c9d1d9; }
    .error-msg {
      background: rgba(248,81,73,0.1);
      border: 1px solid rgba(248,81,73,0.35);
      color: #f85149;
      padding: 0.65em 0.9em;
      border-radius: 8px;
      font-size: 0.83em;
      margin-top: 1em;
      text-align: center;
    }
    .spinner {
      width: 15px; height: 15px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
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
