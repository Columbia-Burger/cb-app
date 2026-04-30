import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CuentaService } from '../../services/cuenta.service';

type Step = 'phone' | 'code';

@Component({
  selector: 'app-cuenta-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './cuenta-login.component.html',
  styleUrl: './cuenta-login.component.scss',
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
