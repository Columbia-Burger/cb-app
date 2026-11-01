import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DomicilioService } from '../../services/domicilio.service';

@Component({
  selector: 'app-domicilio-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './domicilio-login.component.html',
  styleUrl: './domicilio-login.component.scss',
})
export class DomicilioLoginComponent {
  private svc = inject(DomicilioService);
  private router = inject(Router);

  username = '';
  password = '';
  loading = signal(false);
  error = signal<string | null>(null);

  constructor() {
    if (inject(ActivatedRoute).snapshot.queryParamMap.has('expired')) {
      this.error.set('Tu sesión expiró. Vuelve a iniciar sesión.');
    }
  }

  login(): void {
    this.loading.set(true);
    this.error.set(null);
    this.svc.login({ username: this.username.trim(), password: this.password }).subscribe({
      next: () => this.router.navigate(['/domicilio']),
      error: () => {
        this.error.set('Usuario o contraseña incorrectos');
        this.loading.set(false);
      }
    });
  }
}
