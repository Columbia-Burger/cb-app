import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription, interval } from 'rxjs';
import { filter, switchMap } from 'rxjs/operators';
import { isBusinessHours } from '../../../shared/business-hours';
import { DomicilioService } from '../../services/domicilio.service';
import { OrderResponse, CatalogProduct, OrderItemRequest } from '../../../admin/models/admin.model';

interface MenuCategory { id: number; name: string; products: CatalogProduct[]; }
interface CartItem { product: CatalogProduct; quantity: number; note: string; }

@Component({
  selector: 'app-domicilio-board',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, FormsModule],
  template: `
    <div class="shell">
      <header class="topbar">
        <div class="topbar-brand">
          <img src="assets/logo.png" alt="CB" class="topbar-logo" />
          <span>Domiciliario</span>
        </div>
        <div class="topbar-right">
          <button class="logout-btn" (click)="logout()">Salir</button>
        </div>
      </header>

      <!-- Tabs -->
      <div class="tabs">
        <button class="tab" [class.active]="view() === 'deliveries'" (click)="view.set('deliveries')">
          🛵 Domicilios
          @if (orders().length > 0) {
            <span class="tab-badge">{{ orders().length }}</span>
          }
        </button>
        <button class="tab" [class.active]="view() === 'order'" (click)="switchToOrder()">
          🧾 Tomar Pedido
        </button>
      </div>

      <main class="board">

        <!-- ── PESTAÑA DOMICILIOS ── -->
        @if (view() === 'deliveries') {
          @if (loadingDeliveries()) {
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

                  @if (order.deliveryZone) {
                    <div class="card-address">
                      <span>📍</span>
                      <span>{{ order.deliveryZone }}</span>
                    </div>
                  }

                  @if (order.customerLatitude && order.customerLongitude) {
                    <a class="maps-btn"
                       [href]="'https://www.google.com/maps?q=' + order.customerLatitude + ',' + order.customerLongitude"
                       target="_blank" rel="noopener">
                      🗺️ Ver en Google Maps
                    </a>
                  }

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
        }

        <!-- ── PESTAÑA TOMAR PEDIDO ── -->
        @if (view() === 'order') {
          @if (loadingMenu()) {
            <div class="empty">Cargando menú...</div>
          } @else {
            <div class="order-layout">

              <!-- Menú -->
              <div class="menu-panel">
                <div class="category-tabs">
                  @for (cat of categories(); track cat.id) {
                    <button class="tab-btn"
                            [class.active]="selectedCat() === cat.id"
                            (click)="selectedCat.set(cat.id)">
                      {{ cat.name }}
                    </button>
                  }
                </div>
                <div class="products-grid">
                  @for (p of currentProducts(); track p.id) {
                    <div class="product-card" [class.unavailable]="!p.available" (click)="addToCart(p)">
                      <div class="product-name">{{ p.name }}</div>
                      <div class="product-price">{{ p.price | currency:'COP':'symbol-narrow':'1.0-0' }}</div>
                    </div>
                  }
                </div>
              </div>

              <!-- Carrito -->
              <div class="cart-panel">
                <h3 class="cart-title">Pedido</h3>

                <div class="fields">
                  <input type="text" placeholder="Mesa o referencia (ej: Mesa 3, Para llevar...)"
                         [(ngModel)]="customerName" />
                </div>

                @if (cart().length === 0) {
                  <div class="empty-cart">Agrega productos al pedido</div>
                } @else {
                  <div class="cart-items">
                    @for (item of cart(); track item.product.id) {
                      <div class="cart-item">
                        <div class="item-info">
                          <span class="item-name">{{ item.product.name }}</span>
                          <span class="item-price">{{ item.product.price * item.quantity | currency:'COP':'symbol-narrow':'1.0-0' }}</span>
                        </div>
                        <div class="item-controls">
                          <button class="qty-btn" (click)="decreaseQty(item)">−</button>
                          <span class="qty">{{ item.quantity }}</span>
                          <button class="qty-btn" (click)="item.quantity = item.quantity + 1">+</button>
                          <button class="remove-btn" (click)="removeFromCart(item)">✕</button>
                        </div>
                        <input class="note-input" type="text" placeholder="Nota (opcional)"
                               [(ngModel)]="item.note" />
                      </div>
                    }
                  </div>

                  <div class="cart-total">
                    <span>Total</span>
                    <span>{{ total() | currency:'COP':'symbol-narrow':'1.0-0' }}</span>
                  </div>

                  <button class="submit-btn"
                          [disabled]="submitting() || !customerName"
                          (click)="submitOrder()">
                    {{ submitting() ? 'Enviando...' : 'Confirmar Pedido' }}
                  </button>
                }

                @if (successMsg()) {
                  <div class="success-msg">{{ successMsg() }}</div>
                }
                @if (errorMsg()) {
                  <div class="error-msg">{{ errorMsg() }}</div>
                }
              </div>
            </div>
          }
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

    /* Topbar */
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
    .topbar-logo { width: 36px; height: 36px; border-radius: 8px; background: #fff; padding: 3px; object-fit: contain; }
    .logout-btn {
      padding: 0.4em 0.9em;
      background: none;
      border: 1px solid #30363d;
      border-radius: 8px;
      color: #8b949e;
      font-size: 0.82em;
      cursor: pointer;
    }
    .logout-btn:hover { border-color: #f85149; color: #f85149; }

    /* Tabs */
    .tabs {
      display: flex;
      border-bottom: 1px solid #21262d;
      background: #161b22;
    }
    .tab {
      flex: 1;
      padding: 0.85em 1em;
      background: none;
      border: none;
      border-bottom: 3px solid transparent;
      color: #8b949e;
      font-size: 0.9em;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.4em;
      transition: all 0.2s;
    }
    .tab.active { color: #e6edf3; border-bottom-color: #e94560; }
    .tab-badge {
      background: #e94560;
      color: #fff;
      font-size: 0.72em;
      font-weight: 700;
      padding: 0.1em 0.5em;
      border-radius: 20px;
    }

    .board { padding: 1.25em; }

    /* Empty state */
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

    /* ── Delivery cards ── */
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
    .card-header { display: flex; align-items: center; gap: 0.6em; }
    .card-id { font-size: 1.1em; font-weight: 700; color: #e6edf3; }
    .card-badge {
      font-size: 0.72em; font-weight: 700; padding: 0.2em 0.6em;
      border-radius: 20px; background: rgba(188,140,255,0.15); color: #bc8cff;
      text-transform: uppercase; letter-spacing: 0.05em;
    }
    .card-time { margin-left: auto; font-size: 0.8em; color: #8b949e; }
    .card-customer { font-size: 1em; font-weight: 600; color: #e6edf3; }
    .card-address {
      display: flex; align-items: flex-start; gap: 0.4em;
      font-size: 0.9em; color: #c9d1d9;
      background: #0d1117; border-radius: 8px; padding: 0.6em 0.75em;
    }
    .maps-btn {
      display: inline-flex; align-items: center; gap: 0.4em;
      padding: 0.55em 1em; background: rgba(56,139,253,0.12);
      border: 1px solid rgba(56,139,253,0.3); border-radius: 8px;
      color: #58a6ff; font-size: 0.85em; font-weight: 600; text-decoration: none;
      transition: background 0.2s; align-self: flex-start;
    }
    .maps-btn:hover { background: rgba(56,139,253,0.22); }
    .items {
      list-style: none; margin: 0; padding: 0.75em;
      background: #0d1117; border-radius: 10px;
      display: flex; flex-direction: column; gap: 0.45em;
    }
    .item { display: flex; align-items: baseline; flex-wrap: wrap; gap: 0.4em; font-size: 0.9em; }
    .item-qty { color: #e94560; font-weight: 700; min-width: 1.8em; }
    .item-name { color: #e6edf3; font-weight: 600; }
    .item-flavor { color: #8b949e; font-size: 0.85em; }
    .card-notes {
      font-size: 0.82em; color: #8b949e;
      background: rgba(188,140,255,0.07); border: 1px solid rgba(188,140,255,0.15);
      border-radius: 8px; padding: 0.5em 0.75em;
    }
    .card-footer { display: flex; align-items: center; justify-content: space-between; gap: 0.75em; margin-top: 0.15em; }
    .card-total { font-size: 1.05em; font-weight: 700; color: #3fb950; }
    .btn-delivered {
      flex: 1; padding: 0.75em; border: none; border-radius: 10px;
      background: #3fb950; color: #fff; font-size: 0.95em; font-weight: 700; cursor: pointer;
    }
    .btn-delivered:hover:not(:disabled) { background: #2ea043; }
    .btn-delivered:disabled { opacity: 0.5; cursor: wait; }

    /* ── Order panel ── */
    .order-layout {
      display: grid;
      grid-template-columns: 1fr 340px;
      gap: 1.5em;
      align-items: start;
    }
    .menu-panel { display: flex; flex-direction: column; gap: 1em; }
    .category-tabs { display: flex; flex-wrap: wrap; gap: 0.5em; }
    .tab-btn {
      padding: 0.4em 0.9em; background: #21262d; border: 1px solid #30363d;
      border-radius: 20px; color: #8b949e; font-size: 0.8em; cursor: pointer; transition: all 0.2s;
    }
    .tab-btn.active, .tab-btn:hover { background: #e94560; border-color: #e94560; color: #fff; }
    .products-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 0.75em;
    }
    .product-card {
      background: #161b22; border: 1px solid #21262d; border-radius: 10px;
      padding: 0.85em; cursor: pointer; transition: border-color 0.2s;
    }
    .product-card:hover { border-color: #e94560; }
    .product-card.unavailable { opacity: 0.4; pointer-events: none; }
    .product-name { font-size: 0.85em; font-weight: 500; margin-bottom: 0.4em; color: #e6edf3; }
    .product-price { font-size: 0.8em; color: #3fb950; font-weight: 600; }

    .cart-panel {
      background: #161b22; border: 1px solid #21262d; border-radius: 12px;
      padding: 1.25em; position: sticky; top: 1em;
    }
    .cart-title { font-size: 1em; font-weight: 700; color: #e6edf3; margin: 0 0 1em; }
    .fields { display: flex; flex-direction: column; gap: 0.5em; margin-bottom: 1em; }
    .fields input {
      padding: 0.65em 0.85em; background: #0d1117; border: 1px solid #30363d;
      border-radius: 8px; color: #c9d1d9; font-size: 0.85em; outline: none;
    }
    .fields input:focus { border-color: #e94560; }
    .empty-cart { color: #8b949e; font-size: 0.85em; text-align: center; padding: 1.5em 0; }
    .cart-items { display: flex; flex-direction: column; gap: 0.75em; margin-bottom: 1em; }
    .cart-item { background: #0d1117; border: 1px solid #21262d; border-radius: 8px; padding: 0.65em; }
    .item-info { display: flex; justify-content: space-between; margin-bottom: 0.4em; }
    .item-price { font-size: 0.85em; color: #3fb950; font-weight: 600; }
    .item-controls { display: flex; align-items: center; gap: 0.5em; margin-bottom: 0.4em; }
    .qty-btn {
      width: 26px; height: 26px; background: #21262d; border: 1px solid #30363d;
      border-radius: 4px; color: #c9d1d9; cursor: pointer; font-size: 1em;
      display: flex; align-items: center; justify-content: center;
    }
    .qty-btn:hover { background: #30363d; }
    .qty { font-size: 0.9em; min-width: 20px; text-align: center; }
    .remove-btn { margin-left: auto; background: none; border: none; color: #f85149; cursor: pointer; font-size: 0.85em; }
    .note-input {
      width: 100%; padding: 0.4em 0.6em; background: #161b22;
      border: 1px solid #21262d; border-radius: 6px;
      color: #8b949e; font-size: 0.78em;
    }
    .cart-total {
      display: flex; justify-content: space-between; font-weight: 700;
      color: #e6edf3; font-size: 1em; padding: 0.75em 0;
      border-top: 1px solid #21262d; margin-bottom: 1em;
    }
    .submit-btn {
      width: 100%; padding: 0.85em; background: #e94560; color: #fff;
      border: none; border-radius: 8px; font-size: 0.95em; font-weight: 600; cursor: pointer;
    }
    .submit-btn:hover:not(:disabled) { background: #c73652; }
    .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .success-msg {
      margin-top: 0.75em; background: rgba(63,185,80,0.15); border: 1px solid #3fb950;
      color: #3fb950; padding: 0.6em 0.9em; border-radius: 8px; font-size: 0.85em;
    }
    .error-msg {
      margin-top: 0.75em; background: rgba(233,69,96,0.15); border: 1px solid #e94560;
      color: #e94560; padding: 0.6em 0.9em; border-radius: 8px; font-size: 0.85em;
    }

    @media (max-width: 700px) {
      .order-layout { grid-template-columns: 1fr; }
      .cart-panel { position: static; }
      .cards { grid-template-columns: 1fr; }
    }
  `]
})
export class DomicilioBoardComponent implements OnInit, OnDestroy {
  private svc = inject(DomicilioService);
  private router = inject(Router);

  // ── Vista activa ──────────────────────────────────────────────
  view = signal<'deliveries' | 'order'>('deliveries');

  // ── Domicilios ────────────────────────────────────────────────
  orders = signal<OrderResponse[]>([]);
  loadingDeliveries = signal(true);
  updating = new Set<number>();
  private pollSub?: Subscription;

  // ── Tomar pedido ──────────────────────────────────────────────
  loadingMenu = signal(true);
  categories = signal<MenuCategory[]>([]);
  selectedCat = signal<number>(0);
  cart = signal<CartItem[]>([]);
  submitting = signal(false);
  successMsg = signal('');
  errorMsg = signal('');
  customerName = '';

  currentProducts = computed(() =>
    this.categories().find(c => c.id === this.selectedCat())?.products ?? []
  );
  total = computed(() =>
    this.cart().reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  );

  private buildOrderReference(): string {
    return `DOM${Date.now().toString().slice(-13)}`;
  }

  ngOnInit(): void {
    this.loadDeliveries();
    // Poll cada 30s, pero solo cuando la tab está visible
    this.pollSub = interval(30000).pipe(
      filter(() => document.visibilityState === 'visible' && isBusinessHours()),
      switchMap(() => this.svc.getDeliveryOrders())
    ).subscribe(data => this.orders.set(data));
  }

  ngOnDestroy(): void { this.pollSub?.unsubscribe(); }

  loadDeliveries(): void {
    this.svc.getDeliveryOrders().subscribe({
      next: data => { this.orders.set(data); this.loadingDeliveries.set(false); },
      error: () => this.loadingDeliveries.set(false)
    });
  }

  switchToOrder(): void {
    this.view.set('order');
    if (this.categories().length === 0) {
      this.svc.getMenu().subscribe({
        next: products => {
          const map = new Map<number, MenuCategory>();
          for (const p of products) {
            if (!map.has(p.categoryId)) {
              map.set(p.categoryId, { id: p.categoryId, name: p.categoryName, products: [] });
            }
            map.get(p.categoryId)!.products.push(p);
          }
          const cats = Array.from(map.values());
          this.categories.set(cats);
          if (cats.length > 0) this.selectedCat.set(cats[0].id);
          this.loadingMenu.set(false);
        },
        error: () => this.loadingMenu.set(false)
      });
    }
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

  addToCart(product: CatalogProduct): void {
    this.cart.update(items => {
      const existing = items.find(i => i.product.id === product.id);
      if (existing) return items.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...items, { product, quantity: 1, note: '' }];
    });
  }

  decreaseQty(item: CartItem): void {
    if (item.quantity <= 1) { this.removeFromCart(item); return; }
    this.cart.update(items => items.map(i => i.product.id === item.product.id ? { ...i, quantity: i.quantity - 1 } : i));
  }

  removeFromCart(item: CartItem): void {
    this.cart.update(items => items.filter(i => i.product.id !== item.product.id));
  }

  submitOrder(): void {
    if (!this.customerName || this.cart().length === 0) return;
    this.submitting.set(true);
    this.successMsg.set('');
    this.errorMsg.set('');

    const orderItems: OrderItemRequest[] = this.cart().map(i => ({
      productId: i.product.id,
      productName: i.product.name,
      quantity: i.quantity,
      unitPrice: i.product.price,
      note: i.note || undefined
    }));

    this.svc.createOrder({
      customerName: this.customerName,
      customerWhatsapp: this.buildOrderReference(),
      items: orderItems,
      notes: this.customerName,
      source: 'WAITER'
    }).subscribe({
      next: order => {
        this.successMsg.set(`Pedido #${order.id} creado`);
        this.cart.set([]);
        this.customerName = '';
        this.submitting.set(false);
      },
      error: () => {
        this.errorMsg.set('Error al crear el pedido. Intenta de nuevo.');
        this.submitting.set(false);
      }
    });
  }

  logout(): void {
    this.svc.logout();
    this.router.navigate(['/domicilio/login']);
  }
}
