import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { Subscription } from 'rxjs';
import { CocinaService } from '../../services/cocina.service';
import { OrderResponse, OrderStatus } from '../../../admin/models/admin.model';
import { OrderEvent, OrderEventsService } from '../../../services/order-events.service';

@Component({
    selector: 'app-cocina-board',
    imports: [DatePipe, CurrencyPipe],
    templateUrl: './cocina-board.component.html',
    styleUrl: './cocina-board.component.scss'
})
export class CocinaBoardComponent implements OnInit, OnDestroy {
  private svc = inject(CocinaService);
  private orderEvents = inject(OrderEventsService);
  private router = inject(Router);

  orders = signal<OrderResponse[]>([]);
  loading = signal(true);
  updating = new Set<number>();

  private eventSub?: Subscription;
  private refreshHandle?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    this.load();
    this.eventSub = this.orderEvents.connect(this.svc.getToken()).subscribe({
      next: event => this.applyOrderEvent(event),
    });
    this.refreshHandle = setInterval(() => this.load(false), 15000);
  }

  ngOnDestroy(): void {
    this.eventSub?.unsubscribe();
    if (this.refreshHandle) clearInterval(this.refreshHandle);
  }

  load(showLoading = true): void {
    if (showLoading) this.loading.set(true);
    this.svc.getKitchenOrders().subscribe({
      next: data => { this.setOrders(data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  private setOrders(data: OrderResponse[]): void {
    this.orders.set(data);
  }

  private applyOrderEvent(event: OrderEvent): void {
    const order = event.order;
    const shouldShow = order.status === 'RECEIVED' || order.status === 'PREPARING';

    this.orders.update(list => {
      const current = list.filter(item => item.id !== order.id);
      return shouldShow ? [order, ...current] : current;
    });
  }

  changeStatus(order: OrderResponse, status: OrderStatus): void {
    this.updating.add(order.id);
    this.svc.updateOrderStatus(order.id, status).subscribe({
      next: () => {
        this.orders.update(list =>
          status === 'ON_THE_WAY'
            ? list.filter(o => o.id !== order.id)
            : list.map(o => o.id === order.id ? { ...o, status } : o)
        );
        this.updating.delete(order.id);
      },
      error: () => this.updating.delete(order.id)
    });
  }

  logout(): void {
    this.svc.logout();
    this.router.navigate(['/cocina/login']);
  }
}
