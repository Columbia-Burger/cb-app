import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin.service';
import { CatalogCategory, CatalogProduct, OrderItemRequest } from '../../models/admin.model';

interface MenuCategory {
  id: number;
  name: string;
  products: CatalogProduct[];
}

interface CartItem {
  product: CatalogProduct;
  flavor: string;
  additions: string;
  additionsPrice: number;
  quantity: number;
  note: string;
}

interface DeliveryZone { name: string; price: number; }
const DELIVERY_ZONES: DeliveryZone[] = [
  { name: 'Recoger aquí',  price: 0 },
  { name: 'Danubio Azul',  price: 2000 },
  { name: 'La Paz',        price: 3000 },
  { name: 'La Fiscala',    price: 4000 },
  { name: 'Éxito',         price: 6000 },
  { name: 'Artillería',    price: 5000 },
  { name: 'Picota',        price: 5000 },
  { name: 'Diana Turbay',  price: 6000 },
  { name: 'Aptos Caracas', price: 3000 },
];

@Component({
  selector: 'app-admin-mesero',
  standalone: true,
  imports: [CurrencyPipe, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h2 class="page-title">Tomar Pedido</h2>
      </div>

      @if (loading()) {
        <div class="loading">Cargando menú...</div>
      } @else {
        <div class="layout">

          <!-- Menú -->
          <div class="menu-panel">
            <div class="category-tabs">
              @for (cat of categories(); track cat.id) {
                <button
                  class="tab-btn"
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

            <div class="customer-fields">
              <div class="order-type-picker">
                <button class="type-btn" [class.selected]="orderType() === 'mesa'" (click)="orderType.set('mesa')">🪑 Mesa</button>
                <button class="type-btn" [class.selected]="orderType() === 'llevar'" (click)="orderType.set('llevar')">🥡 Para llevar</button>
              </div>
              @if (orderType() === 'mesa') {
                <select [(ngModel)]="tableNumber">
                  <option value="">Selecciona una mesa...</option>
                  <option>Barra 1</option>
                  <option>Barra 2</option>
                  <option>Barra 3</option>
                  <option>Barra 4</option>
                  <option>Mesa 1</option>
                  <option>Mesa 2</option>
                </select>
              }
              @if (orderType() === 'llevar') {
                <select [ngModel]="selectedZoneName()" (ngModelChange)="selectedZoneName.set($event)">
                  <option value="">Selecciona ubicación...</option>
                  @for (z of deliveryZones; track z.name) {
                    <option [value]="z.name">
                      {{ z.name }}{{ z.price > 0 ? ' — ' + (z.price | currency:'COP':'symbol-narrow':'1.0-0') : '' }}
                    </option>
                  }
                </select>
              }
            </div>

            @if (cart().length === 0) {
              <div class="empty-cart">Agrega productos al pedido</div>
            } @else {
              <div class="cart-items">
                @for (item of cart(); track item.product.id + '-' + item.flavor + '-' + item.additions) {
                  <div class="cart-item">
                    <div class="item-info">
                      <div>
                        <span class="item-name">{{ item.product.name }}</span>
                        @if (item.flavor) {
                          <div class="item-flavor-tag">{{ item.flavor }}</div>
                        }
                        @if (item.additions) {
                          <div class="item-additions-tag">+ {{ item.additions }}</div>
                        }
                      </div>
                      <span class="item-price">{{ (item.product.price + item.additionsPrice) * item.quantity | currency:'COP':'symbol-narrow':'1.0-0' }}</span>
                    </div>
                    <div class="item-controls">
                      <button class="qty-btn" (click)="decreaseQty(item)">−</button>
                      <span class="qty">{{ item.quantity }}</span>
                      <button class="qty-btn" (click)="item.quantity = item.quantity + 1">+</button>
                      <button class="remove-btn" (click)="removeFromCart(item)">✕</button>
                    </div>
                    <input
                      class="note-input"
                      type="text"
                      placeholder="Nota (opcional)"
                      [(ngModel)]="item.note"
                    />
                  </div>
                }
              </div>

              @if (orderType() === 'llevar' && (selectedZone()?.price ?? 0) > 0) {
                <div class="cart-subtotal">
                  <span>Subtotal</span>
                  <span>{{ total() | currency:'COP':'symbol-narrow':'1.0-0' }}</span>
                </div>
                <div class="cart-delivery">
                  <span>Domicilio ({{ selectedZone()!.name }})</span>
                  <span>+ {{ selectedZone()!.price | currency:'COP':'symbol-narrow':'1.0-0' }}</span>
                </div>
              }
              <div class="cart-total">
                <span>Total</span>
                <span>{{ grandTotal() | currency:'COP':'symbol-narrow':'1.0-0' }}</span>
              </div>

              <button
                class="submit-btn"
                [disabled]="submitting() || !orderType() || (orderType() === 'mesa' && !tableNumber) || (orderType() === 'llevar' && !selectedZoneName())"
                (click)="submitOrder()">
                @if (submitting()) { Enviando... } @else { Confirmar Pedido }
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

      @if (pendingProduct()) {
        <div class="flavor-overlay" (click)="pendingProduct.set(null)">
          <div class="flavor-sheet" (click)="$event.stopPropagation()">
            <div class="flavor-header">{{ pendingProduct()!.name }}</div>
            <p class="flavor-prompt">Selecciona el sabor:</p>
            <div class="flavor-options">
              @for (f of pendingProduct()!.flavors!; track f.id) {
                <button class="flavor-btn" (click)="pickFlavor(f.name)">{{ f.name }}</button>
              }
            </div>
            <button class="flavor-cancel" (click)="pendingProduct.set(null)">Cancelar</button>
          </div>
        </div>
      }

      @if (pendingAdditionsItem()) {
        <div class="flavor-overlay" (click)="pendingAdditionsItem.set(null)">
          <div class="flavor-sheet" (click)="$event.stopPropagation()">
            <div class="flavor-header">{{ pendingAdditionsItem()!.product.name }}</div>
            <p class="flavor-prompt">Adiciones (opcional):</p>
            <div class="flavor-options">
              @for (a of pendingAdditionsItem()!.product.additions!; track a.id) {
                <label class="addition-option">
                  <input type="checkbox"
                         [checked]="selectedPendingAdditionIds().has(a.id)"
                         (change)="togglePendingAdditionId(a.id)" />
                  <span class="addition-name">{{ a.name }}</span>
                  <span class="addition-price">+{{ a.effectivePrice | currency:'COP':'symbol-narrow':'1.0-0' }}</span>
                </label>
              }
            </div>
            <div class="flavor-options" style="margin-top:0.75em">
              <button class="flavor-btn" style="background:#e94560;border-color:#e94560;color:#fff" (click)="confirmAdditions()">Confirmar</button>
              <button class="flavor-cancel" (click)="pendingAdditionsItem.set(null)">Cancelar</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page { color: #c9d1d9; }
    .page-header { margin-bottom: 1.25em; }
    .page-title { font-size: 1.5em; font-weight: 700; color: #e6edf3; margin: 0; }
    .loading { color: #8b949e; }

    .layout {
      display: grid;
      grid-template-columns: 1fr 360px;
      gap: 1.5em;
      align-items: start;
    }
    @media (max-width: 768px) {
      .layout { grid-template-columns: 1fr; }
      .cart-panel { position: static; }
    }

    /* Menú */
    .menu-panel { display: flex; flex-direction: column; gap: 1em; }
    .category-tabs {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5em;
    }
    .tab-btn {
      padding: 0.4em 0.9em;
      background: #21262d;
      border: 1px solid #30363d;
      border-radius: 20px;
      color: #8b949e;
      font-size: 0.8em;
      cursor: pointer;
      transition: all 0.2s;
    }
    .tab-btn.active, .tab-btn:hover {
      background: #e94560;
      border-color: #e94560;
      color: white;
    }
    .products-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 0.75em;
    }
    .product-card {
      background: #161b22;
      border: 1px solid #21262d;
      border-radius: 10px;
      padding: 0.85em;
      cursor: pointer;
      transition: border-color 0.2s;
    }
    .product-card:hover { border-color: #e94560; }
    .product-card.unavailable { opacity: 0.4; pointer-events: none; }
    .product-name { font-size: 0.85em; font-weight: 500; margin-bottom: 0.4em; color: #e6edf3; }
    .product-price { font-size: 0.8em; color: #3fb950; font-weight: 600; }

    /* Carrito */
    .cart-panel {
      background: #161b22;
      border: 1px solid #21262d;
      border-radius: 12px;
      padding: 1.25em;
      position: sticky;
      top: 1em;
    }
    .cart-title { font-size: 1em; font-weight: 700; color: #e6edf3; margin: 0 0 1em; }
    .customer-fields { display: flex; flex-direction: column; gap: 0.5em; margin-bottom: 1em; }
    .customer-fields input {
      padding: 0.6em 0.85em;
      background: #0d1117;
      border: 1px solid #30363d;
      border-radius: 8px;
      color: #c9d1d9;
      font-size: 0.85em;
    }
    .customer-fields input:focus { outline: none; border-color: #e94560; }
    .customer-fields select {
      padding: 0.6em 0.85em;
      background: #0d1117;
      border: 1px solid #30363d;
      border-radius: 8px;
      color: #c9d1d9;
      font-size: 0.85em;
      outline: none;
      cursor: pointer;
    }
    .customer-fields select:focus { border-color: #e94560; }
    .order-type-picker { display: flex; gap: 0.5em; }
    .type-btn {
      flex: 1; padding: 0.6em 0.5em;
      background: #0d1117; border: 1px solid #30363d;
      border-radius: 8px; color: #8b949e; font-size: 0.82em;
      cursor: pointer; transition: all 0.15s; font-weight: 500;
    }
    .type-btn.selected { background: rgba(233,69,96,0.12); border-color: #e94560; color: #e94560; }
    .empty-cart { color: #8b949e; font-size: 0.85em; text-align: center; padding: 1.5em 0; }
    .cart-items { display: flex; flex-direction: column; gap: 0.75em; margin-bottom: 1em; }
    .cart-item {
      background: #0d1117;
      border: 1px solid #21262d;
      border-radius: 8px;
      padding: 0.65em;
    }
    .item-info { display: flex; justify-content: space-between; margin-bottom: 0.4em; }
    .item-name { font-size: 0.85em; color: #e6edf3; }
    .item-price { font-size: 0.85em; color: #3fb950; font-weight: 600; }
    .item-controls { display: flex; align-items: center; gap: 0.5em; margin-bottom: 0.4em; }
    .qty-btn {
      width: 24px; height: 24px;
      background: #21262d;
      border: 1px solid #30363d;
      border-radius: 4px;
      color: #c9d1d9;
      cursor: pointer;
      font-size: 1em;
      display: flex; align-items: center; justify-content: center;
    }
    .qty-btn:hover { background: #30363d; }
    .qty { font-size: 0.9em; min-width: 20px; text-align: center; }
    .remove-btn {
      margin-left: auto;
      background: none;
      border: none;
      color: #f85149;
      cursor: pointer;
      font-size: 0.85em;
    }
    .note-input {
      width: 100%;
      padding: 0.4em 0.6em;
      background: #161b22;
      border: 1px solid #21262d;
      border-radius: 6px;
      color: #8b949e;
      font-size: 0.78em;
      box-sizing: border-box;
    }
    .note-input:focus { outline: none; border-color: #30363d; }
    .cart-subtotal, .cart-delivery {
      display: flex;
      justify-content: space-between;
      font-size: 0.82em;
      color: #8b949e;
      padding: 0.3em 0;
    }
    .cart-delivery { color: #bc8cff; }
    .cart-total {
      display: flex;
      justify-content: space-between;
      font-weight: 700;
      color: #e6edf3;
      font-size: 1em;
      padding: 0.75em 0;
      border-top: 1px solid #21262d;
      margin-bottom: 1em;
    }
    .submit-btn {
      width: 100%;
      padding: 0.85em;
      background: #e94560;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 0.95em;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }
    .submit-btn:hover:not(:disabled) { background: #c73652; }
    .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .success-msg {
      margin-top: 0.75em;
      background: rgba(63,185,80,0.15);
      border: 1px solid #3fb950;
      color: #3fb950;
      padding: 0.6em 0.9em;
      border-radius: 8px;
      font-size: 0.85em;
    }
    .error-msg {
      margin-top: 0.75em;
      background: rgba(233,69,96,0.15);
      border: 1px solid #e94560;
      color: #e94560;
      padding: 0.6em 0.9em;
      border-radius: 8px;
      font-size: 0.85em;
    }
    .item-flavor-tag { font-size: 0.75em; color: #8b949e; margin-top: 2px; }
    .item-additions-tag { font-size: 0.75em; color: #bc8cff; margin-top: 2px; }
    .addition-option {
      display: flex; align-items: center; gap: 0.6em;
      padding: 0.6em 0.75em; background: #21262d; border-radius: 8px; cursor: pointer;
      font-size: 0.9em; color: #e6edf3;
    }
    .addition-option input { accent-color: #e94560; width: 16px; height: 16px; cursor: pointer; }
    .addition-name { flex: 1; }
    .addition-price { font-size: 0.8em; color: #3fb950; white-space: nowrap; }

    .flavor-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.6);
      display: flex;
      align-items: flex-end;
      justify-content: center;
      z-index: 100;
      padding: 0 0 env(safe-area-inset-bottom, 0);
    }
    .flavor-sheet {
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 14px 14px 0 0;
      padding: 1em 1em 1.25em;
      width: 100%;
      max-width: 480px;
      max-height: 60vh;
      overflow-y: auto;
    }
    .flavor-header { font-size: 1em; font-weight: 700; color: #e6edf3; margin-bottom: 0.2em; }
    .flavor-prompt { font-size: 0.8em; color: #8b949e; margin: 0 0 0.75em; }
    .flavor-options { display: flex; flex-direction: column; gap: 0.4em; margin-bottom: 0.6em; }
    .flavor-btn {
      padding: 0.65em 1em;
      background: #21262d;
      border: 1px solid #30363d;
      border-radius: 8px;
      color: #e6edf3;
      font-size: 0.9em;
      cursor: pointer;
      text-align: left;
      transition: all 0.15s;
    }
    .flavor-btn:hover { border-color: #e94560; color: #e94560; }
    .flavor-cancel {
      width: 100%;
      padding: 0.4em;
      background: none;
      border: none;
      color: #8b949e;
      font-size: 0.82em;
      cursor: pointer;
    }
    .flavor-cancel:hover { color: #c9d1d9; }
  `]
})
export class AdminMeseroComponent implements OnInit {
  private adminService = inject(AdminService);

  loading = signal(true);
  categories = signal<MenuCategory[]>([]);
  selectedCat = signal<number>(0);
  cart = signal<CartItem[]>([]);
  submitting = signal(false);
  successMsg = signal('');
  errorMsg = signal('');
  pendingProduct = signal<CatalogProduct | null>(null);

  pendingAdditionsItem = signal<{ product: CatalogProduct; flavor: string } | null>(null);
  selectedPendingAdditionIds = signal<Set<number>>(new Set());

  orderType = signal<'mesa' | 'llevar' | ''>('');
  tableNumber = '';
  selectedZoneName = signal('');

  readonly deliveryZones = DELIVERY_ZONES;

  selectedZone = computed(() =>
    DELIVERY_ZONES.find(z => z.name === this.selectedZoneName()) ?? null
  );

  currentProducts = computed(() =>
    this.categories().find(c => c.id === this.selectedCat())?.products ?? []
  );

  total = computed(() =>
    this.cart().reduce((sum, item) => sum + (item.product.price + item.additionsPrice) * item.quantity, 0)
  );

  grandTotal = computed(() =>
    this.total() + (this.selectedZone()?.price ?? 0)
  );

  ngOnInit(): void {
    this.adminService.getMenu().subscribe({
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
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  addToCart(product: CatalogProduct): void {
    if (product.flavors?.length) {
      this.pendingProduct.set(product);
      return;
    }
    this.confirmItem(product, '');
  }

  pickFlavor(flavor: string): void {
    const product = this.pendingProduct();
    if (!product) return;
    this.pendingProduct.set(null);
    this.confirmItem(product, flavor);
  }

  private confirmItem(product: CatalogProduct, flavor: string): void {
    if (product.additions?.length) {
      this.selectedPendingAdditionIds.set(new Set());
      this.pendingAdditionsItem.set({ product, flavor });
      return;
    }
    this.addProductToCart(product, flavor, '', 0);
  }

  togglePendingAdditionId(id: number): void {
    this.selectedPendingAdditionIds.update(ids => {
      const next = new Set(ids);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  confirmAdditions(): void {
    const item = this.pendingAdditionsItem();
    if (!item) return;
    const selected = item.product.additions!.filter(a => this.selectedPendingAdditionIds().has(a.id));
    const additionsStr = selected.map(a => a.name).join(', ');
    const additionsPrice = selected.reduce((s, a) => s + a.effectivePrice, 0);
    this.pendingAdditionsItem.set(null);
    this.addProductToCart(item.product, item.flavor, additionsStr, additionsPrice);
  }

  private addProductToCart(product: CatalogProduct, flavor: string, additions: string, additionsPrice: number): void {
    this.cart.update(items => {
      const existing = items.find(i => i.product.id === product.id && i.flavor === flavor && i.additions === additions);
      if (existing) {
        return items.map(i =>
          i.product.id === product.id && i.flavor === flavor && i.additions === additions
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...items, { product, flavor, additions, additionsPrice, quantity: 1, note: '' }];
    });
  }

  decreaseQty(item: CartItem): void {
    if (item.quantity <= 1) {
      this.removeFromCart(item);
    } else {
      this.cart.update(items =>
        items.map(i =>
          i.product.id === item.product.id && i.flavor === item.flavor && i.additions === item.additions
            ? { ...i, quantity: i.quantity - 1 }
            : i
        )
      );
    }
  }

  removeFromCart(item: CartItem): void {
    this.cart.update(items =>
      items.filter(i => !(i.product.id === item.product.id && i.flavor === item.flavor && i.additions === item.additions))
    );
  }

  submitOrder(): void {
    const type = this.orderType();
    const zone = this.selectedZone();
    if (!type || this.cart().length === 0) return;
    if (type === 'mesa' && !this.tableNumber) return;
    if (type === 'llevar' && !this.selectedZoneName()) return;

    this.submitting.set(true);
    this.successMsg.set('');
    this.errorMsg.set('');

    const notes = type === 'mesa' ? this.tableNumber : 'Para llevar';

    const items: OrderItemRequest[] = this.cart().map(i => ({
      productId: i.product.id,
      productName: i.product.name,
      flavor: i.flavor || undefined,
      additions: i.additions || undefined,
      quantity: i.quantity,
      unitPrice: i.product.price + i.additionsPrice,
      note: i.note || undefined
    }));

    this.adminService.createOrder({
      customerName: 'Mesero',
      customerWhatsapp: 'ADMIN-WAITER',
      items,
      notes,
      deliveryZone: type === 'llevar' ? zone?.name : undefined,
      deliveryFee: type === 'llevar' ? (zone?.price ?? 0) : undefined,
      source: 'WAITER'
    }).subscribe({
      next: (order) => {
        this.successMsg.set(`Pedido #${order.id} — ${notes}`);
        this.cart.set([]);
        this.orderType.set('');
        this.tableNumber = '';
        this.selectedZoneName.set('');
        this.submitting.set(false);
      },
      error: () => {
        this.errorMsg.set('Error al crear el pedido. Intenta de nuevo.');
        this.submitting.set(false);
      }
    });
  }
}
