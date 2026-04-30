import { Component, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { CuentaService, CustomerProfile } from '../../services/cuenta.service';

@Component({
  selector: 'app-cuenta-perfil',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './cuenta-perfil.component.html',
  styleUrl: './cuenta-perfil.component.scss',
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
