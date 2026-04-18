import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Subscription, interval } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { DomicilioService } from '../../services/domicilio.service';
import { OrderResponse } from '../../../admin/models/admin.model';

@Component({
  selector: 'app-domicilio-board',
  standalone: true,
  imports: [CurrencyPipe, DatePipe],
  template: `
    <div class="shell">
      <header class="topbar">
        <div class="topbar-brand">
          <img src="assets/logo.png" alt="CB" class="topbar-logo" />
          <span>Domiciliario</span>
        </div>
        <div class="topbar-right">
          <span class="counter">{{ orders().length }} en camino</span>
          <button class="logout-btn" (click)="logout()">Salir</button>
        </div>
      </header>

      <main class="board">
        @if (loading()) {
          <div class="empty">Cargando pedidos...</div>
        } @else if (orders().length === 0) {
          <div class="empty">
            <span class="empty-icon">🛵</span>
            <p>Sin pedidos en camino</p>
          </div>
        } @else {
          <div class="cards">
            @for (order of orders(); track order.id) {
              <div class="card">
                <div class="card-header">
                  <div class="card-id">#{{ order.id }}</div>
                  <div class="card-badge">En camino</div>
                  <div class="card-time">{{ order.createdAt | date:'HH:mm' }}</div>
                </div>

                <div class="card-customer">{{ order.customerName }}</div>

                <!-- Dirección -->
                @if (order.deliveryZone) {
                  <div class="card-address">
                    <span class="address-icon">📍</span>
                    <span>{{ order.deliveryZone }}</span>
                  </div>
                }

                <!-- Link a Maps si hay coordenadas -->
                @if (order.customerLatitude && order.customerLongitude) {
                  <a class="maps-btn"
                     [href]="'https://www.google.com/maps?q=' + order.customerLatitude + ',' + order.customerLongitude"
                     target="_blank" rel="noopener">
                    🗺️ Ver en Google Maps
                  </a>
                }

                <!-- Items -->
                <ul class="items">
                  @for (item of order.items; track item.id) {
                    <li class="item">
                      <span class="item-qty">{{ item.quantity }}×</span>
                      <span class="item-name">{{ item.productName }}</span>
                      @if (item.flavor) {
                        <span class="item-flavor">{{ item.flavor }}</span>
                      }
                    </li>
                  }
                </ul>

                <!-- Notas (método de pago) -->
                @if (order.notes) {
                  <div class="card-notes">💳 {{ order.notes }}</div>
                }

                <div class="card-footer">
                  <span class="card-total">{{ order.total | currency:'COP':'symbol-narrow':'1.0-0' }}</span>
                  <button class="btn-delivered"
                          [disabled]="updating.has(order.id)"
                          (click)="markDelivered(order)">
                    ✅ Entregado
                  </button>
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

    .board { padding: 1.25em; }

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
    .empty p { margin: 0; }

    .cards {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1em;
      align-items: start;
    }

    .card {
      background: #161b22;
      border: 2px solid #bc8cff;
      border-radius: 14px;
      padding: 1.1em;
      display: flex;
      flex-direction: column;
      gap: 0.65em;
    }

    .card-header {
      display: flex;
      align-items: center;
      gap: 0.6em;
    }
    .card-id { font-size: 1.1em; font-weight: 700; color: #e6edf3; }
    .card-badge {
      font-size: 0.72em;
      font-weight: 700;
      padding: 0.2em 0.6em;
      border-radius: 20px;
      background: rgba(188,140,255,0.15);
      color: #bc8cff;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .card-time { margin-left: auto; font-size: 0.8em; color: #8b949e; }

    .card-customer { font-size: 1em; font-weight: 600; color: #e6edf3; }

    .card-address {
      display: flex;
      align-items: flex-start;
      gap: 0.4em;
      font-size: 0.9em;
      color: #c9d1d9;
      background: #0d1117;
      border-radius: 8px;
      padding: 0.6em 0.75em;
    }
    .address-icon { flex-shrink: 0; }

    .maps-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.4em;
      padding: 0.55em 1em;
      background: rgba(56,139,253,0.12);
      border: 1px solid rgba(56,139,253,0.3);
      border-radius: 8px;
      color: #58a6ff;
      font-size: 0.85em;
      font-weight: 600;
      text-decoration: none;
      transition: background 0.2s;
      align-self: flex-start;
    }
    .maps-btn:hover { background: rgba(56,139,253,0.22); }

    .items {
      list-style: none;
      margin: 0;
      padding: 0.75em;
      background: #0d1117;
      border-radius: 10px;
      display: flex;
      flex-direction: column;
      gap: 0.45em;
    }
    .item {
      display: flex;
      align-items: baseline;
      flex-wrap: wrap;
      gap: 0.4em;
      font-size: 0.9em;
    }
    .item-qty { color: #e94560; font-weight: 700; min-width: 1.8em; }
    .item-name { color: #e6edf3; font-weight: 600; }
    .item-flavor { color: #8b949e; font-size: 0.85em; }

    .card-notes {
      font-size: 0.82em;
      color: #8b949e;
      background: rgba(188,140,255,0.07);
      border: 1px solid rgba(188,140,255,0.15);
      border-radius: 8px;
      padding: 0.5em 0.75em;
    }

    .card-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75em;
      margin-top: 0.15em;
    }
    .card-total {
      font-size: 1.05em;
      font-weight: 700;
      color: #3fb950;
    }
    .btn-delivered {
      flex: 1;
      padding: 0.75em;
      border: none;
      border-radius: 10px;
      background: #3fb950;
      color: #fff;
      font-size: 0.95em;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.2s;
    }
    .btn-delivered:hover:not(:disabled) { background: #2ea043; }
    .btn-delivered:disabled { opacity: 0.5; cursor: wait; }

    @media (max-width: 600px) {
      .cards { grid-template-columns: 1fr; }
    }
  `]
})
export class DomicilioBoardComponent implements OnInit, OnDestroy {
  private svc = inject(DomicilioService);
  private router = inject(Router);

  orders = signal<OrderResponse[]>([]);
  loading = signal(true);
  updating = new Set<number>();

  private pollSub?: Subscription;

  ngOnInit(): void {
    this.load();
    this.pollSub = interval(10000).pipe(
      switchMap(() => this.svc.getDeliveryOrders())
    ).subscribe(data => this.orders.set(data));
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
  }

  load(): void {
    this.svc.getDeliveryOrders().subscribe({
      next: data => { this.orders.set(data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  markDelivered(order: OrderResponse): void {
    this.updating.add(order.id);
    this.svc.updateOrderStatus(order.id, 'DELIVERED').subscribe({
      next: () => {
        this.orders.update(list => list.filter(o => o.id !== order.id));
        this.updating.delete(order.id);
      },
      error: () => this.updating.delete(order.id)
    });
  }

  logout(): void {
    this.svc.logout();
    this.router.navigate(['/domicilio/login']);
  }
}
