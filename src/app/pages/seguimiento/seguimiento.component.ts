import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { environment } from '../../../environments/environment';
import { OrderTrackingResponse, OrderStatus } from '../../admin/models/admin.model';

interface Step {
  status: OrderStatus;
  label: string;
  icon: string;
}

const STEPS: Step[] = [
  { status: 'RECEIVED',   label: 'Pedido recibido',   icon: '📋' },
  { status: 'PREPARING',  label: 'En preparación',    icon: '👨‍🍳' },
  { status: 'ON_THE_WAY', label: 'En camino',         icon: '🛵' },
  { status: 'DELIVERED',  label: 'Entregado',         icon: '✅' },
];

const STATUS_ORDER: Record<string, number> = {
  RECEIVED: 0, PREPARING: 1, ON_THE_WAY: 2, DELIVERED: 3, CANCELLED: -1
};

@Component({
  selector: 'app-seguimiento',
  standalone: true,
  imports: [CurrencyPipe, DatePipe],
  templateUrl: './seguimiento.component.html',
  styleUrl: './seguimiento.component.scss',
})
export class SeguimientoComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);

  loading = signal(true);
  order = signal<OrderTrackingResponse | null>(null);
  error = signal<string | null>(null);

  steps = STEPS;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set('ID de pedido inválido.');
      this.loading.set(false);
      return;
    }
    this.http.get<OrderTrackingResponse>(`${environment.businessApiUrl}/api/orders/${id}/tracking`)
      .subscribe({
        next: data => {
          this.order.set(data);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Pedido no encontrado. Verifica el enlace.');
          this.loading.set(false);
        }
      });
  }

  isDone(status: OrderStatus): boolean {
    const current = this.order()?.status;
    if (!current) return false;
    return STATUS_ORDER[status] < STATUS_ORDER[current];
  }

  isActive(status: OrderStatus): boolean {
    return this.order()?.status === status;
  }

  statusLabel(status: OrderStatus): string {
    const labels: Record<OrderStatus, string> = {
      RECEIVED:   'Pedido recibido',
      PREPARING:  'En preparación',
      ON_THE_WAY: 'En camino',
      DELIVERED:  'Entregado',
      CANCELLED:  'Cancelado'
    };
    return labels[status] ?? status;
  }
}
