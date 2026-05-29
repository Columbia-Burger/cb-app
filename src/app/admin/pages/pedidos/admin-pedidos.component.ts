import { Component, inject, signal, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { AdminService } from '../../services/admin.service';
import { OrderResponse, OrderStatus } from '../../models/admin.model';
import { Subscription } from 'rxjs';
import { getCurrentBusinessDayStartParam, isCurrentBusinessDayOrder } from '../../../shared/business-hours';
import { OrderEvent, OrderEventsService } from '../../../services/order-events.service';

interface KanbanColumn {
  status: OrderStatus;
  label: string;
  color: string;
  orders: OrderResponse[];
}

@Component({
  selector: 'app-admin-pedidos',
  standalone: true,
  imports: [CurrencyPipe, DatePipe],
  templateUrl: './admin-pedidos.component.html',
  styleUrl: './admin-pedidos.component.scss',
})
export class AdminPedidosComponent implements OnInit, AfterViewInit, OnDestroy {
  private adminService = inject(AdminService);
  private orderEvents = inject(OrderEventsService);

  loading = signal(true);
  selectedOrder = signal<OrderResponse | null>(null);
  newOrderAlert = signal(false);

  @ViewChild('modalOverlay') overlayRef!: ElementRef<HTMLDivElement>;

  columns = signal<KanbanColumn[]>([
    { status: 'RECEIVED',   label: 'Recibido',    color: '#d29922', orders: [] },
    { status: 'PREPARING',  label: 'Preparando',  color: '#388bfd', orders: [] },
    { status: 'ON_THE_WAY', label: 'En camino',   color: '#bc8cff', orders: [] },
    { status: 'DELIVERED',  label: 'Entregado',   color: '#3fb950', orders: [] },
    { status: 'CANCELLED',  label: 'Cancelado',   color: '#f85149', orders: [] },
  ]);

  private nextMap: Record<OrderStatus, { status: OrderStatus; label: string; color: string }[]> = {
    RECEIVED:   [{ status: 'PREPARING',  label: '→ Preparando', color: '#388bfd' }, { status: 'CANCELLED', label: '✕ Cancelar', color: '#f85149' }],
    PREPARING:  [{ status: 'ON_THE_WAY', label: '→ En camino', color: '#bc8cff' }, { status: 'CANCELLED', label: '✕ Cancelar', color: '#f85149' }],
    ON_THE_WAY: [{ status: 'DELIVERED',  label: '→ Entregado', color: '#3fb950' }],
    DELIVERED:  [{ status: 'CANCELLED', label: '✕ Cancelar', color: '#f85149' }],
    CANCELLED:  [],
  };

  private knownIds = new Set<number>();
  private eventSub?: Subscription;

  ngOnInit(): void {
    this.startPolling();
  }

  ngAfterViewInit(): void {
    // Move overlay to document.body to escape any ancestor stacking context
    document.body.appendChild(this.overlayRef.nativeElement);
  }

  private startPolling(): void {
    this.load();
    this.eventSub = this.orderEvents.connect(this.adminService.getToken()).subscribe({
      next: event => this.applyOrderEvent(event),
    });
  }

  ngOnDestroy(): void {
    this.eventSub?.unsubscribe();
    const overlay = this.overlayRef?.nativeElement;
    if (overlay?.parentNode === document.body) {
      document.body.removeChild(overlay);
    }
  }

  load(): void {
    this.loading.set(true);
    this.adminService.getOrders(undefined, this.getBusinessDayStart()).subscribe({
      next: orders => {
        this.applyOrders(orders);
        this.loading.set(false);
      },
      error: err => this.handleLoadError(err)
    });
  }

  private handleLoadError(error: { status?: number }): void {
    this.loading.set(false);
  }

  private getBusinessDayStart(): string {
    return getCurrentBusinessDayStartParam();
  }

  private applyOrders(orders: OrderResponse[]): void {
    const currentOrders = orders.filter(order => isCurrentBusinessDayOrder(order.createdAt));
    const newOnes = currentOrders.filter(o => o.status === 'RECEIVED' && !this.knownIds.has(o.id));
    if (newOnes.length > 0) {
      this.playAlert();
      this.newOrderAlert.set(true);
      setTimeout(() => this.newOrderAlert.set(false), 4000);
    }
    currentOrders.forEach(o => this.knownIds.add(o.id));
    this.columns.update(cols =>
      cols.map(col => ({ ...col, orders: currentOrders.filter(o => o.status === col.status) }))
    );
  }

  private applyOrderEvent(event: OrderEvent): void {
    if (!isCurrentBusinessDayOrder(event.order.createdAt)) return;

    const orders = this.columns()
      .flatMap(col => col.orders)
      .filter(order => order.id !== event.order.id);

    this.applyOrders([event.order, ...orders]);
  }

  private playAlert(): void {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(660, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } catch { /* navegador sin audio */ }
  }

  getNextStatuses(status: OrderStatus) {
    return this.nextMap[status] ?? [];
  }

  selectOrder(order: OrderResponse): void {
    this.selectedOrder.set(order);
  }

  closeDialog(): void {
    this.selectedOrder.set(null);
  }

  changeStatus(event: Event, order: OrderResponse, status: OrderStatus): void {
    event.stopPropagation();
    this.adminService.updateOrderStatus(order.id, status).subscribe({
      next: () => this.load()
    });
  }

  exportCsv(): void {
    const allOrders = this.columns().flatMap(col => col.orders)
      .sort((a, b) => a.id - b.id);

    if (allOrders.length === 0) return;

    const statusLabel: Record<OrderStatus, string> = {
      RECEIVED: 'Recibido', PREPARING: 'Preparando',
      ON_THE_WAY: 'En camino', DELIVERED: 'Entregado', CANCELLED: 'Cancelado'
    };

    const escape = (v: unknown) => {
      const s = String(v ?? '').replace(/"/g, '""');
      return `"${s}"`;
    };

    const headers = ['ID', 'Fecha', 'Cliente', 'WhatsApp', 'Estado', 'Zona', 'Domicilio', 'Total', 'Productos'];

    const rows = allOrders.map(o => {
      const productos = o.items
        .map(i => `${i.quantity}x ${i.productName}${i.flavor ? ' (' + i.flavor + ')' : ''}`)
        .join(' | ');
      return [
        o.id,
        escape(o.createdAt?.replace('T', ' ').substring(0, 16)),
        escape(o.customerName),
        escape(o.customerWhatsapp),
        escape(statusLabel[o.status]),
        escape(o.deliveryZone ?? ''),
        o.deliveryFee ?? 0,
        o.total,
        escape(productos)
      ].join(',');
    });

    const csv = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const today = new Date().toISOString().substring(0, 10);
    a.href = url;
    a.download = `pedidos-${today}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
