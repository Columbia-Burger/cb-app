import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { AdminService } from '../../services/admin.service';
import { OrderResponse, OrderStatus, ShiftResponse } from '../../models/admin.model';
import { Subscription, interval } from 'rxjs';
import { switchMap, finalize } from 'rxjs/operators';

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
  template: `
    <div class="page">
      <div class="page-header">
        <h2 class="page-title">Pedidos</h2>
        <button class="refresh-btn" (click)="load()" [disabled]="loading()">
          🔄 Actualizar
        </button>
      </div>

      @if (newOrderAlert()) {
        <div class="new-order-toast">🔔 ¡Nuevo pedido recibido!</div>
      }

      @if (loading()) {
        <div class="loading">Cargando pedidos...</div>
      } @else {
        <div class="kanban">
          @for (col of columns(); track col.status) {
            <div class="column">
              <div class="column-header" [style.border-color]="col.color">
                <span class="col-label">{{ col.label }}</span>
                <span class="col-count" [style.background]="col.color">{{ col.orders.length }}</span>
              </div>

              <div class="cards">
                @for (order of col.orders; track order.id) {
                  <div class="order-card" (click)="selectOrder(order)">
                    <div class="order-top">
                      <span class="order-id">#{{ order.id }}</span>
                      <span class="order-total">{{ order.total | currency:'COP':'symbol-narrow':'1.0-0' }}</span>
                    </div>
                    <div class="order-customer">{{ order.customerName }}</div>
                    <div class="order-meta">
                      @if (order.deliveryZone) {
                        <span class="tag">📍 {{ order.deliveryZone }}</span>
                      }
                      <span class="time">{{ order.createdAt | date:'HH:mm' }}</span>
                    </div>
                    <div class="order-actions">
                      @for (next of getNextStatuses(order.status); track next.status) {
                        <button
                          class="action-btn"
                          [style.border-color]="next.color"
                          [style.color]="next.color"
                          (click)="changeStatus($event, order, next.status)">
                          {{ next.label }}
                        </button>
                      }
                    </div>
                  </div>
                } @empty {
                  <div class="empty-col">Sin pedidos</div>
                }
              </div>
            </div>
          }
        </div>
      }

      <!-- Modal detalle -->
      @if (selectedOrder()) {
        <div class="modal-backdrop" (click)="selectedOrder.set(null)">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Pedido #{{ selectedOrder()!.id }}</h3>
              <button class="close-btn" (click)="selectedOrder.set(null)">✕</button>
            </div>
            <div class="modal-body">
              <p><strong>Cliente:</strong> {{ selectedOrder()!.customerName }}</p>
              <p><strong>WhatsApp:</strong> {{ selectedOrder()!.customerWhatsapp }}</p>
              @if (selectedOrder()!.deliveryZone) {
                <p><strong>Zona:</strong> {{ selectedOrder()!.deliveryZone }}</p>
              }
              @if (selectedOrder()!.notes) {
                <p><strong>Notas:</strong> {{ selectedOrder()!.notes }}</p>
              }
              <div class="items-list">
                @for (item of selectedOrder()!.items; track item.id) {
                  <div class="item-row">
                    <span class="item-qty">{{ item.quantity }}x</span>
                    <span class="item-name">
                      {{ item.productName }}
                      @if (item.flavor) { — {{ item.flavor }} }
                    </span>
                    <span class="item-price">{{ item.subtotal | currency:'COP':'symbol-narrow':'1.0-0' }}</span>
                  </div>
                }
              </div>
              @if (selectedOrder()!.deliveryFee > 0) {
                <div class="total-row">
                  <span>Domicilio</span>
                  <span>{{ selectedOrder()!.deliveryFee | currency:'COP':'symbol-narrow':'1.0-0' }}</span>
                </div>
              }
              <div class="total-row total-final">
                <span>Total</span>
                <span>{{ selectedOrder()!.total | currency:'COP':'symbol-narrow':'1.0-0' }}</span>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page { color: #c9d1d9; }
    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.5em;
    }
    .page-title { font-size: 1.5em; font-weight: 700; color: #e6edf3; margin: 0; }
    .refresh-btn {
      padding: 0.5em 1em;
      background: #21262d;
      border: 1px solid #30363d;
      border-radius: 8px;
      color: #c9d1d9;
      cursor: pointer;
      font-size: 0.85em;
    }
    .refresh-btn:hover { background: #30363d; }
    .loading { color: #8b949e; }
    .kanban {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 1em;
      align-items: start;
    }
    .column {
      background: #161b22;
      border-radius: 12px;
      border: 1px solid #21262d;
      overflow: hidden;
    }
    .column-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75em 1em;
      border-bottom: 2px solid;
    }
    .col-label { font-size: 0.8em; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #e6edf3; }
    .col-count {
      font-size: 0.75em;
      font-weight: 700;
      color: #0d1117;
      border-radius: 50%;
      width: 1.4em;
      height: 1.4em;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .cards { padding: 0.5em; display: flex; flex-direction: column; gap: 0.5em; min-height: 60px; }
    .order-card {
      background: #0d1117;
      border: 1px solid #21262d;
      border-radius: 8px;
      padding: 0.75em;
      cursor: pointer;
      transition: border-color 0.2s;
    }
    .order-card:hover { border-color: #e94560; }
    .order-top { display: flex; justify-content: space-between; margin-bottom: 0.25em; }
    .order-id { color: #8b949e; font-size: 0.8em; }
    .order-total { color: #3fb950; font-weight: 600; font-size: 0.85em; }
    .order-customer { font-size: 0.9em; font-weight: 500; margin-bottom: 0.35em; }
    .order-meta { display: flex; justify-content: space-between; margin-bottom: 0.5em; }
    .tag { font-size: 0.75em; color: #8b949e; }
    .time { font-size: 0.75em; color: #8b949e; }
    .order-actions { display: flex; flex-direction: column; gap: 0.25em; }
    .action-btn {
      padding: 0.3em 0.5em;
      background: transparent;
      border: 1px solid;
      border-radius: 6px;
      font-size: 0.75em;
      cursor: pointer;
      transition: opacity 0.2s;
    }
    .action-btn:hover { opacity: 0.8; }
    .empty-col { padding: 1em; color: #8b949e; font-size: 0.8em; text-align: center; }
    .new-order-toast {
      background: #d29922;
      color: #0d1117;
      font-weight: 700;
      padding: 0.75em 1.25em;
      border-radius: 10px;
      margin-bottom: 1em;
      font-size: 0.95em;
      animation: fadeIn 0.3s ease;
    }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }

    /* Modal */
    .modal-backdrop {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.7);
      display: flex; align-items: center; justify-content: center;
      z-index: 100;
    }
    .modal {
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 16px;
      width: 90%;
      max-width: 480px;
      max-height: 80vh;
      overflow-y: auto;
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.25em 1.5em;
      border-bottom: 1px solid #21262d;
    }
    .modal-header h3 { margin: 0; color: #e6edf3; }
    .close-btn {
      background: none; border: none;
      color: #8b949e; font-size: 1.1em; cursor: pointer;
    }
    .modal-body { padding: 1.25em 1.5em; }
    .modal-body p { margin: 0.4em 0; font-size: 0.9em; }
    .items-list {
      margin: 1em 0;
      border-top: 1px solid #21262d;
      padding-top: 0.75em;
    }
    .item-row {
      display: flex;
      gap: 0.5em;
      padding: 0.4em 0;
      font-size: 0.9em;
      border-bottom: 1px solid #21262d;
    }
    .item-row:last-child { border-bottom: none; }
    .item-qty { color: #8b949e; min-width: 24px; }
    .item-name { flex: 1; }
    .item-price { color: #3fb950; }
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 0.4em 0;
      font-size: 0.9em;
      color: #8b949e;
    }
    .total-final {
      font-weight: 700;
      font-size: 1em;
      color: #e6edf3;
      border-top: 1px solid #21262d;
      margin-top: 0.25em;
      padding-top: 0.5em;
    }
  `]
})
export class AdminPedidosComponent implements OnInit, OnDestroy {
  private adminService = inject(AdminService);

  loading = signal(true);
  selectedOrder = signal<OrderResponse | null>(null);
  newOrderAlert = signal(false);

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
    DELIVERED:  [],
    CANCELLED:  [],
  };

  private knownIds = new Set<number>();
  private pollSub?: Subscription;
  private shiftFrom: string | undefined;

  ngOnInit(): void {
    this.adminService.getCurrentShift().pipe(
      finalize(() => this.startPolling())
    ).subscribe({
      next: res => {
        if ('active' in res && res.active) {
          this.shiftFrom = (res as ShiftResponse).openedAt;
        }
      },
      error: () => {}
    });
  }

  private startPolling(): void {
    this.load();
    this.pollSub = interval(5000).pipe(
      switchMap(() => this.adminService.getOrders(undefined, this.shiftFrom))
    ).subscribe(orders => this.applyOrders(orders));
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
  }

  load(): void {
    this.loading.set(true);
    this.adminService.getOrders(undefined, this.shiftFrom).subscribe({
      next: orders => {
        this.applyOrders(orders);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  private applyOrders(orders: OrderResponse[]): void {
    const newOnes = orders.filter(o => o.status === 'RECEIVED' && !this.knownIds.has(o.id));
    if (newOnes.length > 0) {
      this.playAlert();
      this.newOrderAlert.set(true);
      setTimeout(() => this.newOrderAlert.set(false), 4000);
    }
    orders.forEach(o => this.knownIds.add(o.id));
    this.columns.update(cols =>
      cols.map(col => ({ ...col, orders: orders.filter(o => o.status === col.status) }))
    );
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

  changeStatus(event: Event, order: OrderResponse, status: OrderStatus): void {
    event.stopPropagation();
    this.adminService.updateOrderStatus(order.id, status).subscribe({
      next: () => this.load()
    });
  }
}
