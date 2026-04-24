import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { isCurrentBusinessDayOrder } from '../../../shared/business-hours';
import { DomicilioService } from '../../services/domicilio.service';
import { OrderResponse, CatalogProduct, OrderItemRequest } from '../../../admin/models/admin.model';
import { OrderEvent, OrderEventsService } from '../../../services/order-events.service';

interface MenuCategory { id: number; name: string; products: CatalogProduct[]; }
interface CartItem { product: CatalogProduct; flavor: string; additions: string; additionsPrice: number; combo: string; comboPrice: number; quantity: number; note: string; }

interface ZoneOption { name: string; price: number; }
const PICKUP_OPTION: ZoneOption = { name: 'Recoger aquí', price: 0 };

const COMBO_DRINK_NAMES = ['Gaseosa Postobón 400ml', 'Jugo Hit 500ml'];

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
                      @for (z of deliveryZones(); track z.name) {
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
                            @if (item.combo) {
                              <div class="item-combo-tag">🍟 {{ item.combo }}</div>
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
                        <input class="note-input" type="text" placeholder="Nota (opcional)"
                               [(ngModel)]="item.note" />
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

                  <button class="submit-btn"
                          [disabled]="submitting() || !orderType() || (orderType() === 'mesa' && !tableNumber) || (orderType() === 'llevar' && !selectedZoneName())"
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

      @if (pendingComboItem()) {
        <div class="flavor-overlay" (click)="pendingComboItem.set(null)">
          <div class="flavor-sheet" (click)="$event.stopPropagation()">
            <div class="flavor-header">{{ pendingComboItem()!.product.name }}</div>
            <p class="flavor-prompt">¿La deseas en combo? ({{ pendingComboItem()!.product.comboDescription }})</p>
            <div class="combo-toggle">
              <button class="combo-toggle-btn" [class.active]="comboAccepted() === true" (click)="comboAccepted.set(true)">Sí</button>
              <button class="combo-toggle-btn" [class.active]="comboAccepted() === false" (click)="comboAccepted.set(false)">No</button>
            </div>
            @if (comboAccepted() === true) {
              <p class="flavor-prompt" style="margin-top:0.75em">Bebida del combo:</p>
              <select class="combo-select" [ngModel]="comboDrink()" (ngModelChange)="comboDrink.set($event); comboDrinkFlavor.set('')">
                <option value="">Selecciona la bebida...</option>
                @for (d of comboDrinks(); track d.label) {
                  <option [value]="d.label">{{ d.label }}</option>
                }
              </select>
              @if (comboDrink()) {
                <p class="flavor-prompt" style="margin-top:0.75em">Sabor de la bebida:</p>
                <select class="combo-select" [ngModel]="comboDrinkFlavor()" (ngModelChange)="comboDrinkFlavor.set($event)">
                  <option value="">Selecciona el sabor...</option>
                  @for (f of selectedComboDrinkFlavors(); track f) {
                    <option [value]="f">{{ f }}</option>
                  }
                </select>
              }
            }
            <div class="flavor-options" style="margin-top:0.75em">
              <button class="flavor-btn" style="background:#e94560;border-color:#e94560;color:#fff"
                      [disabled]="!canConfirmCombo()"
                      (click)="confirmCombo()">Confirmar</button>
              <button class="flavor-cancel" (click)="pendingComboItem.set(null)">Cancelar</button>
            </div>
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
    .fields select {
      padding: 0.65em 0.85em;
      background: #0d1117;
      border: 1px solid #30363d;
      border-radius: 8px;
      color: #c9d1d9;
      font-size: 0.85em;
      outline: none;
      cursor: pointer;
    }
    .fields select:focus { border-color: #e94560; }
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
    .cart-subtotal, .cart-delivery {
      display: flex; justify-content: space-between;
      font-size: 0.82em; color: #8b949e; padding: 0.3em 0;
    }
    .cart-delivery { color: #bc8cff; }
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
    .item-flavor-tag { font-size: 0.75em; color: #8b949e; margin-top: 2px; }
    .item-additions-tag { font-size: 0.75em; color: #bc8cff; margin-top: 2px; }
    .item-combo-tag { font-size: 0.75em; color: #e3b341; margin-top: 2px; }
    .combo-toggle { display: flex; gap: 0.5em; margin-bottom: 0.5em; }
    .combo-toggle-btn {
      flex: 1; padding: 0.65em 1em;
      background: #21262d; border: 1px solid #30363d;
      border-radius: 8px; color: #e6edf3; font-size: 0.9em; cursor: pointer; transition: all 0.15s;
    }
    .combo-toggle-btn.active { background: rgba(233,69,96,0.15); border-color: #e94560; color: #e94560; }
    .combo-select {
      width: 100%; padding: 0.6em 0.75em;
      background: #21262d; border: 1px solid #30363d; border-radius: 8px;
      color: #e6edf3; font-size: 0.9em; outline: none; cursor: pointer; margin-bottom: 0.25em;
    }
    .combo-select:focus { border-color: #e94560; }
    .addition-option {
      display: flex; align-items: center; gap: 0.6em;
      padding: 0.6em 0.75em; background: #21262d; border-radius: 8px; cursor: pointer;
      font-size: 0.9em; color: #e6edf3;
    }
    .addition-option input { accent-color: #e94560; width: 16px; height: 16px; cursor: pointer; }
    .addition-name { flex: 1; }
    .addition-price { font-size: 0.8em; color: #3fb950; white-space: nowrap; }

    .flavor-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.6);
      display: flex; align-items: flex-end; justify-content: center; z-index: 100;
      padding: 0 0 env(safe-area-inset-bottom, 0);
    }
    .flavor-sheet {
      background: #161b22; border: 1px solid #30363d; border-radius: 14px 14px 0 0;
      padding: 1em 1em 1.25em; width: 100%; max-width: 480px;
      max-height: 60vh; overflow-y: auto;
    }
    .flavor-header { font-size: 1em; font-weight: 700; color: #e6edf3; margin-bottom: 0.2em; }
    .flavor-prompt { font-size: 0.8em; color: #8b949e; margin: 0 0 0.75em; }
    .flavor-options { display: flex; flex-direction: column; gap: 0.4em; margin-bottom: 0.6em; }
    .flavor-btn {
      padding: 0.65em 1em; background: #21262d; border: 1px solid #30363d;
      border-radius: 8px; color: #e6edf3; font-size: 0.9em; cursor: pointer; text-align: left; transition: all 0.15s;
    }
    .flavor-btn:hover { border-color: #e94560; color: #e94560; }
    .flavor-cancel { width: 100%; padding: 0.4em; background: none; border: none; color: #8b949e; font-size: 0.82em; cursor: pointer; }
    .flavor-cancel:hover { color: #c9d1d9; }

    @media (max-width: 700px) {
      .order-layout { grid-template-columns: 1fr; }
      .cart-panel { position: static; }
      .cards { grid-template-columns: 1fr; }
    }
  `]
})
export class DomicilioBoardComponent implements OnInit, OnDestroy {
  private svc = inject(DomicilioService);
  private orderEvents = inject(OrderEventsService);
  private router = inject(Router);

  // ── Vista activa ──────────────────────────────────────────────
  view = signal<'deliveries' | 'order'>('deliveries');

  // ── Domicilios ────────────────────────────────────────────────
  orders = signal<OrderResponse[]>([]);
  loadingDeliveries = signal(true);
  updating = new Set<number>();
  private eventSub?: Subscription;

  // ── Tomar pedido ──────────────────────────────────────────────
  loadingMenu = signal(true);
  categories = signal<MenuCategory[]>([]);
  selectedCat = signal<number>(0);
  cart = signal<CartItem[]>([]);
  submitting = signal(false);
  successMsg = signal('');
  errorMsg = signal('');
  pendingProduct = signal<CatalogProduct | null>(null);
  pendingComboItem = signal<{ product: CatalogProduct; flavor: string } | null>(null);
  pendingAdditionsItem = signal<{ product: CatalogProduct; flavor: string; combo: string } | null>(null);
  selectedPendingAdditionIds = signal<Set<number>>(new Set());
  comboAccepted = signal<boolean | null>(null);
  comboDrink = signal('');
  comboDrinkFlavor = signal('');
  comboDrinks = signal<{ label: string; flavors: string[] }[]>([]);
  selectedComboDrinkFlavors = computed(() =>
    this.comboDrinks().find(d => d.label === this.comboDrink())?.flavors ?? []
  );
  canConfirmCombo = computed(() => {
    const accepted = this.comboAccepted();
    if (accepted === null) return false;
    if (!accepted) return true;
    return !!this.comboDrink() && !!this.comboDrinkFlavor();
  });
  orderType = signal<'mesa' | 'llevar' | ''>('');
  tableNumber = '';
  selectedZoneName = signal('');
  deliveryZones = signal<ZoneOption[]>([PICKUP_OPTION]);

  selectedZone = computed(() =>
    this.deliveryZones().find(z => z.name === this.selectedZoneName()) ?? null
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
    this.loadDeliveries();
    this.eventSub = this.orderEvents.connect(this.svc.getToken()).subscribe({
      next: event => this.applyOrderEvent(event),
    });
  }

  ngOnDestroy(): void {
    this.eventSub?.unsubscribe();
  }

  loadDeliveries(): void {
    this.svc.getDeliveryOrders().subscribe({
      next: data => { this.setOrders(data); this.loadingDeliveries.set(false); },
      error: () => this.loadingDeliveries.set(false)
    });
  }

  private setOrders(data: OrderResponse[]): void {
    this.orders.set(data.filter(order => isCurrentBusinessDayOrder(order.createdAt)));
  }

  private applyOrderEvent(event: OrderEvent): void {
    const order = event.order;
    const shouldShow = isCurrentBusinessDayOrder(order.createdAt) && order.status === 'ON_THE_WAY';

    this.orders.update(list => {
      const current = list.filter(item => item.id !== order.id);
      return shouldShow ? [order, ...current] : current;
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
          this.comboDrinks.set(
            products
              .filter(p => COMBO_DRINK_NAMES.includes(p.name))
              .map(p => ({ label: p.name, flavors: p.flavors?.map(f => f.name) ?? [] }))
          );
          this.loadingMenu.set(false);
        },
        error: () => this.loadingMenu.set(false)
      });
      this.svc.getDeliveryZones().subscribe({
        next: zones => {
          this.deliveryZones.set([
            PICKUP_OPTION,
            ...zones.map(z => ({ name: z.name, price: z.deliveryFee }))
          ]);
        }
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
    if (product.comboDescription) {
      this.comboAccepted.set(null);
      this.comboDrink.set('');
      this.comboDrinkFlavor.set('');
      this.pendingComboItem.set({ product, flavor });
      return;
    }
    this.confirmAdditionsOrAdd(product, flavor, '');
  }

  confirmCombo(): void {
    const item = this.pendingComboItem();
    if (!item || !this.canConfirmCombo()) return;
    this.pendingComboItem.set(null);
    const accepted = this.comboAccepted()!;
    const combo = accepted
      ? `Combo (${item.product.comboDescription}) — ${this.comboDrink()} ${this.comboDrinkFlavor()}`
      : '';
    this.confirmAdditionsOrAdd(item.product, item.flavor, combo);
  }

  private confirmAdditionsOrAdd(product: CatalogProduct, flavor: string, combo: string): void {
    if (product.additions?.length) {
      this.selectedPendingAdditionIds.set(new Set());
      this.pendingAdditionsItem.set({ product, flavor, combo });
      return;
    }
    this.addProductToCart(product, flavor, '', 0, combo, 0);
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
    this.addProductToCart(item.product, item.flavor, additionsStr, additionsPrice, item.combo, 0);
  }

  private addProductToCart(product: CatalogProduct, flavor: string, additions: string, additionsPrice: number, combo: string, comboPrice: number): void {
    this.cart.update(items => {
      const existing = items.find(i =>
        i.product.id === product.id && i.flavor === flavor && i.additions === additions && i.combo === combo
      );
      if (existing) return items.map(i =>
        i.product.id === product.id && i.flavor === flavor && i.additions === additions && i.combo === combo
          ? { ...i, quantity: i.quantity + 1 }
          : i
      );
      return [...items, { product, flavor, additions, additionsPrice, combo, comboPrice, quantity: 1, note: '' }];
    });
  }

  decreaseQty(item: CartItem): void {
    if (item.quantity <= 1) { this.removeFromCart(item); return; }
    this.cart.update(items => items.map(i =>
      i.product.id === item.product.id && i.flavor === item.flavor && i.additions === item.additions && i.combo === item.combo
        ? { ...i, quantity: i.quantity - 1 }
        : i
    ));
  }

  removeFromCart(item: CartItem): void {
    this.cart.update(items => items.filter(i =>
      !(i.product.id === item.product.id && i.flavor === item.flavor && i.additions === item.additions && i.combo === item.combo)
    ));
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

    const orderItems: OrderItemRequest[] = this.cart().map(i => {
      const allExtras = [i.additions, i.combo].filter(Boolean).join(', ');
      return {
        productId: i.product.id,
        productName: i.product.name,
        flavor: i.flavor || undefined,
        additions: allExtras || undefined,
        quantity: i.quantity,
        unitPrice: i.product.price + i.additionsPrice,
        note: i.note || undefined
      };
    });

    this.svc.createOrder({
      customerName: 'Domiciliario',
      customerWhatsapp: 'DOMICILIO-WAITER',
      items: orderItems,
      notes,
      deliveryZone: type === 'llevar' ? zone?.name : undefined,
      deliveryFee: type === 'llevar' ? (zone?.price ?? 0) : undefined,
      source: 'WAITER'
    }).subscribe({
      next: order => {
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

  logout(): void {
    this.svc.logout();
    this.router.navigate(['/domicilio/login']);
  }
}
