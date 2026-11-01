import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CocinaService } from '../../services/cocina.service';

@Component({
  selector: 'app-cocina-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './cocina-login.component.html',
  styleUrl: './cocina-login.component.scss',
})
export class CocinaLoginComponent {
  private svc = inject(CocinaService);
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
      next: () => this.router.navigate(['/cocina']),
      error: () => {
        this.error.set('Usuario o contraseña incorrectos');
        this.loading.set(false);
      }
    });
  }
}
