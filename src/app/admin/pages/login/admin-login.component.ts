import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './admin-login.component.html',
  styleUrl: './admin-login.component.scss'
})
export class AdminLoginComponent {
  private adminService = inject(AdminService);
  private router = inject(Router);

  username = '';
  password = '';
  loading = signal(false);
  error = signal('');

  constructor() {
    if (inject(ActivatedRoute).snapshot.queryParamMap.has('expired')) {
      this.error.set('Tu sesión expiró. Vuelve a iniciar sesión.');
    }
  }

  onSubmit(): void {
    if (!this.username.trim() || !this.password) return;
    this.loading.set(true);
    this.error.set('');
    this.adminService.login({ username: this.username.trim(), password: this.password }).subscribe({
      next: () => this.router.navigate(['/admin/dashboard']),
      error: () => {
        this.error.set('Credenciales inválidas. Verifica tu usuario y contraseña.');
        this.loading.set(false);
      }
    });
  }
}
