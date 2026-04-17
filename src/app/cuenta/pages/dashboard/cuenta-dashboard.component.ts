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
  standalone: true,
  imports: [DatePipe, CurrencyPipe, NgClass],
  template: `
    <div class="shell">
      <!-- Header -->
      <header class="topbar">
        <div class="brand">🍔 Columbia Burger</div>
        <div class="nav-links">
          <a (click)="goTo('dashboard')" class="nav-link active">Mis pedidos</a>
          <a (click)="goTo('perfil')" class="nav-link">Mi perfil</a>
          <button class="btn-logout" (click)="logout()">Salir</button>
        </div>
      </header>

      <main class="content">
        <!-- Greeting -->
        @if (profile()) {
          <h2 class="greeting">Hola, {{ profile()!.name || 'Cliente' }} 👋</h2>
        }

        <!-- Loading -->
        @if (loading()) {
          <div class="loading-wrap">
            <div class="spinner"></div>
            <p>Cargando tus pedidos…</p>
          </div>
        }

        <!-- Error -->
        @if (error()) {
          <p class="error">{{ error() }}</p>
        }

        <!-- Empty -->
        @if (!loading() && !error() && orders().length === 0) {
          <div class="empty-state">
            <p class="empty-icon">🛍️</p>
            <p class="empty-text">Aún no tienes pedidos</p>
            <p class="empty-hint">¡Pide a través de WhatsApp y aquí verás tu historial!</p>
          </div>
        }

        <!-- Order list -->
        @if (!loading() && orders().length > 0) {
          <div class="orders-list">
            @for (order of orders(); track order.id) {
              <div class="order-card">
                <div class="order-header">
                  <span class="order-id">#{{ order.id }}</span>
                  <span class="status-badge" [ngClass]="statusClass(order.status)">
                    {{ statusLabel(order.status) }}
                  </span>
                  <span class="order-date">{{ order.createdAt | date:'d MMM yyyy, h:mm a' }}</span>
                </div>

                <div class="order-items">
                  @for (item of order.items; track item.id) {
                    <div class="order-item">
                      <span class="item-qty">{{ item.quantity }}×</span>
                      <span class="item-name">{{ item.productName }}</span>
                      @if (item.flavor) {
                        <span class="item-flavor">{{ item.flavor }}</span>
                      }
                      @if (item.note) {
                        <span class="item-note">— {{ item.note }}</span>
                      }
                      <span class="item-price">{{ item.subtotal | currency:'COP':'symbol-narrow':'1.0-0' }}</span>
                    </div>
                  }
                </div>

                <div class="order-footer">
                  @if (order.deliveryZone) {
                    <span class="delivery-zone">🛵 {{ order.deliveryZone }}</span>
                  }
                  <span class="order-total">Total: {{ (order.total + order.deliveryFee) | currency:'COP':'symbol-narrow':'1.0-0' }}</span>
                  <a class="btn-reorder" [href]="reorderLink(order)" target="_blank" rel="noopener">
                    🔁 Pedir de nuevo
                  </a>
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
    .shell { min-height: 100vh; background: #0d1117; color: #e6edf3; font-family: system-ui, sans-serif; }

    /* Topbar */
    .topbar {
      background: #161b22;
      border-bottom: 1px solid #21262d;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.85em 1.5em;
      position: sticky;
      top: 0;
      z-index: 10;
    }
    .brand { color: #e94560; font-weight: 700; font-size: 1.1em; }
    .nav-links { display: flex; align-items: center; gap: 1em; }
    .nav-link { color: #8b949e; font-size: 0.9em; cursor: pointer; text-decoration: none; padding: 0.25em 0; border-bottom: 2px solid transparent; transition: color 0.2s; }
    .nav-link:hover, .nav-link.active { color: #e6edf3; border-bottom-color: #e94560; }
    .btn-logout { background: none; border: 1px solid #30363d; color: #8b949e; border-radius: 6px; padding: 0.4em 0.9em; font-size: 0.85em; cursor: pointer; transition: all 0.2s; }
    .btn-logout:hover { border-color: #f85149; color: #f85149; }

    /* Content */
    .content { max-width: 700px; margin: 0 auto; padding: 2em 1em; }
    .greeting { font-size: 1.3em; font-weight: 600; margin: 0 0 1.5em; }

    /* Loading */
    .loading-wrap { text-align: center; padding: 3em; color: #8b949e; }
    .spinner { width: 36px; height: 36px; border: 3px solid #30363d; border-top-color: #e94560; border-radius: 50%; animation: spin 0.7s linear infinite; margin: 0 auto 1em; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .error { color: #f85149; text-align: center; padding: 2em; }

    /* Empty state */
    .empty-state { text-align: center; padding: 4em 2em; }
    .empty-icon { font-size: 3em; margin: 0 0 0.5em; }
    .empty-text { color: #e6edf3; font-size: 1.1em; font-weight: 500; margin: 0 0 0.4em; }
    .empty-hint { color: #8b949e; font-size: 0.9em; margin: 0; }

    /* Order cards */
    .orders-list { display: flex; flex-direction: column; gap: 1em; }
    .order-card {
      background: #161b22;
      border: 1px solid #21262d;
      border-radius: 12px;
      padding: 1.25em;
    }
    .order-header {
      display: flex;
      align-items: center;
      gap: 0.75em;
      margin-bottom: 1em;
      flex-wrap: wrap;
    }
    .order-id { font-weight: 700; font-size: 0.95em; color: #e94560; }
    .order-date { color: #8b949e; font-size: 0.8em; margin-left: auto; }

    /* Status badges */
    .status-badge { font-size: 0.75em; font-weight: 600; padding: 0.25em 0.7em; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.04em; }
    .status-pending   { background: #3d2f00; color: #e3b341; }
    .status-confirmed { background: #0d2a4a; color: #58a6ff; }
    .status-preparing { background: #2d1f6e; color: #a371f7; }
    .status-ready     { background: #0f3d22; color: #56d364; }
    .status-delivered { background: #1a3626; color: #3fb950; }
    .status-cancelled { background: #3d0f0f; color: #f85149; }

    /* Items */
    .order-items { border-top: 1px solid #21262d; border-bottom: 1px solid #21262d; padding: 0.75em 0; margin-bottom: 0.75em; display: flex; flex-direction: column; gap: 0.4em; }
    .order-item { display: flex; align-items: baseline; gap: 0.4em; font-size: 0.88em; flex-wrap: wrap; }
    .item-qty { color: #8b949e; min-width: 1.5em; }
    .item-name { font-weight: 500; }
    .item-flavor { color: #8b949e; font-size: 0.9em; }
    .item-note { color: #6e7681; font-size: 0.85em; font-style: italic; }
    .item-price { margin-left: auto; color: #e6edf3; }

    /* Footer */
    .order-footer { display: flex; align-items: center; gap: 0.75em; font-size: 0.88em; flex-wrap: wrap; }
    .delivery-zone { color: #8b949e; }
    .order-total { font-weight: 700; color: #e94560; margin-right: auto; }
    .btn-reorder {
      background: #1a3626; color: #3fb950; border: 1px solid #2ea043;
      border-radius: 6px; padding: 0.35em 0.85em; font-size: 0.82em;
      font-weight: 600; text-decoration: none; cursor: pointer;
      transition: background 0.2s;
      white-space: nowrap;
    }
    .btn-reorder:hover { background: #0f3d22; }
  `]
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
