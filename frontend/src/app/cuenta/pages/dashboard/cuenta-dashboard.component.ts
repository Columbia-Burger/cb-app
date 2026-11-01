import { Component, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe, CurrencyPipe, NgClass } from '@angular/common';
import { CuentaService, CustomerOrder, CustomerProfile } from '../../services/cuenta.service';
import { environment } from '../../../../environments/environment';

const STATUS_LABEL: Record<string, string> = {
  PENDING:    'Pendiente',
  CONFIRMED:  'Confirmado',
  PREPARING:  'En preparación',
  READY:      'Listo',
  DELIVERED:  'Entregado',
  CANCELLED:  'Cancelado',
};

const STATUS_CLASS: Record<string, string> = {
  PENDING:    'status-pending',
  CONFIRMED:  'status-confirmed',
  PREPARING:  'status-preparing',
  READY:      'status-ready',
  DELIVERED:  'status-delivered',
  CANCELLED:  'status-cancelled',
};

@Component({
    selector: 'app-cuenta-dashboard',
    imports: [DatePipe, CurrencyPipe, NgClass],
    templateUrl: './cuenta-dashboard.component.html',
    styleUrl: './cuenta-dashboard.component.scss'
})
export class CuentaDashboardComponent implements OnInit {
  private svc = inject(CuentaService);
  private router = inject(Router);

  profile = signal<CustomerProfile | null>(null);
  orders = signal<CustomerOrder[]>([]);
  loading = signal(true);
  error = signal('');

  ngOnInit(): void {
    this.svc.getProfile().subscribe({
      next: p => this.profile.set(p),
      error: () => {}
    });

    this.svc.getOrders().subscribe({
      next: orders => {
        this.orders.set(orders);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Error al cargar tus pedidos.');
        this.loading.set(false);
      }
    });
  }

  reorderLink(order: CustomerOrder): string {
    const lines = order.items.map(i => {
      let line = `${i.quantity}x ${i.productName}`;
      if (i.flavor) line += ` (${i.flavor})`;
      if (i.note) line += ` - ${i.note}`;
      return line;
    });
    const msg = `Hola, quiero repetir este pedido:\n${lines.join('\n')}`;
    return `https://wa.me/${environment.whatsappNumber}?text=${encodeURIComponent(msg)}`;
  }

  statusLabel(status: string): string {
    return STATUS_LABEL[status] ?? status;
  }

  statusClass(status: string): string {
    return STATUS_CLASS[status] ?? '';
  }

  goTo(page: string): void {
    this.router.navigate(['/cuenta', page]);
  }

  logout(): void {
    this.svc.logout();
    this.router.navigate(['/cuenta/login']);
  }
}
