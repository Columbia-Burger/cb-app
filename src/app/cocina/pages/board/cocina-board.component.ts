import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { Subscription, interval } from 'rxjs';
import { filter, switchMap } from 'rxjs/operators';
import { isCurrentBusinessDayOrder } from '../../../shared/business-hours';
import { CocinaService } from '../../services/cocina.service';
import { OrderResponse, OrderStatus } from '../../../admin/models/admin.model';

@Component({
  selector: 'app-cocina-board',
  standalone: true,
  imports: [DatePipe, CurrencyPipe],
  template: `
    <div class="shell">
      <header class="topbar">
        <div class="topbar-brand">
          <img src="assets/logo.png" alt="CB" class="topbar-logo" />
          <span>Cocina</span>
        </div>
        <div class="topbar-right">
          <span class="counter">{{ orders().length }} pedidos activos</span>
          <button class="logout-btn" (click)="logout()">Salir</button>
        </div>
      </header>

      <main class="board">
        @if (loading()) {
          <div class="empty">Cargando pedidos...</div>
        } @else if (orders().length === 0) {
          <div class="empty">
            <span class="empty-icon">✅</span>
            <p>Sin pedidos pendientes</p>
          </div>
        } @else {
          <div class="cards">
            @for (order of orders(); track order.id) {
              <div class="card" [class.preparing]="order.status === 'PREPARING'">
                <div class="card-header">
                  <div class="card-id">#{{ order.id }}</div>
                  <div class="card-badge" [class.badge-received]="order.status === 'RECEIVED'"
                       [class.badge-preparing]="order.status === 'PREPARING'">
                    {{ order.status === 'RECEIVED' ? 'Nuevo' : 'Preparando' }}
                  </div>
                  <div class="card-time">{{ order.createdAt | date:'HH:mm' }}</div>
                </div>

                <div class="card-customer">{{ order.customerName }}</div>

                @if (order.deliveryZone) {
                  <div class="card-zone">📍 {{ order.deliveryZone }}</div>
                }

                <ul class="items">
                  @for (item of order.items; track item.id) {
                    <li class="item">
                      <span class="item-qty">{{ item.quantity }}×</span>
                      <span class="item-name">{{ item.productName }}</span>
                      @if (item.flavor) {
                        <span class="item-flavor">{{ item.flavor }}</span>
                      }
                      @if (item.note) {
                        <span class="item-note">📝 {{ item.note }}</span>
                      }
                    </li>
                  }
                </ul>

                @if (order.notes) {
                  <div class="card-notes">📝 {{ order.notes }}</div>
                }

                <div class="card-actions">
                  @if (order.status === 'RECEIVED') {
                    <button class="btn-action btn-prepare"
                      [disabled]="updating.has(order.id)"
                      (click)="changeStatus(order, 'PREPARING')">
                      👨‍🍳 Empezar a preparar
                    </button>
                  }
                  @if (order.status === 'PREPARING') {
                    <button class="btn-action btn-ready"
                      [disabled]="updating.has(order.id)"
                      (click)="changeStatus(order, 'ON_THE_WAY')">
                      🛵 Listo para enviar
                    </button>
                  }
                </div>
              </div>
            }
          </div>
        }
      </main>
    </div>
  `,
  styles: [`
    * { box-sizing: border-box; }

    .shell {
      min-height: 100vh;
      background: #0d1117;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      color: #c9d1d9;
    }

    .topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75em 1.25em;
      background: #161b22;
      border-bottom: 1px solid #21262d;
      position: sticky;
      top: 0;
      z-index: 10;
    }
    .topbar-brand {
      display: flex;
      align-items: center;
      gap: 0.6em;
      font-weight: 700;
      font-size: 1.1em;
      color: #e6edf3;
    }
    .topbar-logo {
      width: 36px; height: 36px;
      border-radius: 8px;
      background: #fff;
      padding: 3px;
      object-fit: contain;
    }
    .topbar-right { display: flex; align-items: center; gap: 1em; }
    .counter { font-size: 0.82em; color: #8b949e; }
    .logout-btn {
      padding: 0.4em 0.9em;
      background: none;
      border: 1px solid #30363d;
      border-radius: 8px;
      color: #8b949e;
      font-size: 0.82em;
      cursor: pointer;
      transition: all 0.2s;
    }
    .logout-btn:hover { border-color: #f85149; color: #f85149; }

    .board {
      padding: 1.25em;
    }

    .empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5em;
      padding: 4em 1em;
      color: #8b949e;
      text-align: center;
    }
    .empty-icon { font-size: 3em; }
    .empty p { margin: 0; font-size: 1em; }

    .cards {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1em;
      align-items: start;
    }

    .card {
      background: #161b22;
      border: 2px solid #d29922;
      border-radius: 14px;
      padding: 1.1em;
      display: flex;
      flex-direction: column;
      gap: 0.6em;
    }
    .card.preparing { border-color: #388bfd; }

    .card-header {
      display: flex;
      align-items: center;
      gap: 0.6em;
    }
    .card-id {
      font-size: 1.1em;
      font-weight: 700;
      color: #e6edf3;
    }
    .card-badge {
      font-size: 0.72em;
      font-weight: 700;
      padding: 0.2em 0.6em;
      border-radius: 20px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .badge-received  { background: rgba(210,153,34,0.15); color: #d29922; }
    .badge-preparing { background: rgba(56,139,253,0.15); color: #388bfd; }
    .card-time { margin-left: auto; font-size: 0.8em; color: #8b949e; }

    .card-customer { font-size: 1em; font-weight: 600; color: #e6edf3; }
    .card-zone { font-size: 0.82em; color: #8b949e; }

    .items {
      list-style: none;
      margin: 0;
      padding: 0.75em;
      background: #0d1117;
      border-radius: 10px;
      display: flex;
      flex-direction: column;
      gap: 0.5em;
    }
    .item {
      display: flex;
      align-items: baseline;
      flex-wrap: wrap;
      gap: 0.4em;
      font-size: 0.95em;
    }
    .item-qty {
      color: #e94560;
      font-weight: 700;
      font-size: 1.05em;
      min-width: 1.8em;
    }
    .item-name { color: #e6edf3; font-weight: 600; }
    .item-flavor { color: #8b949e; font-size: 0.85em; }
    .item-note {
      width: 100%;
      padding-left: 2em;
      color: #8b949e;
      font-size: 0.82em;
      font-style: italic;
    }

    .card-notes {
      font-size: 0.82em;
      color: #8b949e;
      background: rgba(210,153,34,0.08);
      border: 1px solid rgba(210,153,34,0.2);
      border-radius: 8px;
      padding: 0.5em 0.75em;
    }

    .card-actions { margin-top: 0.25em; }
    .btn-action {
      width: 100%;
      padding: 0.75em;
      border: none;
      border-radius: 10px;
      font-size: 1em;
      font-weight: 700;
      cursor: pointer;
      transition: opacity 0.2s;
    }
    .btn-action:disabled { opacity: 0.5; cursor: wait; }
    .btn-prepare { background: #388bfd; color: #fff; }
    .btn-prepare:hover:not(:disabled) { background: #2070e0; }
    .btn-ready   { background: #3fb950; color: #fff; }
    .btn-ready:hover:not(:disabled) { background: #2ea043; }

    @media (max-width: 600px) {
      .cards { grid-template-columns: 1fr; }
    }
  `]
})
export class CocinaBoardComponent implements OnInit, OnDestroy {
  private svc = inject(CocinaService);
  private router = inject(Router);

  orders = signal<OrderResponse[]>([]);
  loading = signal(true);
  updating = new Set<number>();

  private pollSub?: Subscription;

  ngOnInit(): void {
    this.load();
    this.pollSub = interval(5000).pipe(
      filter(() => document.visibilityState === 'visible'),
      switchMap(() => this.svc.getKitchenOrders())
    ).subscribe(data => this.setOrders(data));
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
  }

  load(): void {
    this.svc.getKitchenOrders().subscribe({
      next: data => { this.setOrders(data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  private setOrders(data: OrderResponse[]): void {
    this.orders.set(data.filter(order => isCurrentBusinessDayOrder(order.createdAt)));
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
