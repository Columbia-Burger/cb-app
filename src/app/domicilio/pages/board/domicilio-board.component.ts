import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { isCurrentBusinessDayOrder, getCurrentBusinessDayStartParam } from '../../../shared/business-hours';
import { DomicilioService } from '../../services/domicilio.service';
import { OrderResponse, OrderItemResponse, CatalogProduct, OrderItemRequest, UpdateOrderRequest } from '../../../admin/models/admin.model';
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
  templateUrl: './domicilio-board.component.html',
  styleUrl: './domicilio-board.component.scss',
})
export class DomicilioBoardComponent implements OnInit, OnDestroy {
  private svc = inject(DomicilioService);
  private orderEvents = inject(OrderEventsService);
  private router = inject(Router);

  // ── Vista activa ──────────────────────────────────────────────
  view = signal<'deliveries' | 'order' | 'edit'>('deliveries');

  // ── Domicilios ────────────────────────────────────────────────
  orders = signal<OrderResponse[]>([]);
  loadingDeliveries = signal(true);
  updating = new Set<number>();
  private eventSub?: Subscription;

  // ── Editar pedido ─────────────────────────────────────────────
  editableOrders = signal<OrderResponse[]>([]);
  loadingEditOrders = signal(false);
  editingOrder = signal<OrderResponse | null>(null);
  editItems = signal<OrderItemResponse[]>([]);
  editNotes = signal('');
  editShowSearch = signal(false);
  editSearchTerm = signal('');
  savingEdit = signal(false);
  editError = signal('');
  editPendingProduct = signal<CatalogProduct | null>(null);
  editPendingAdditionIds = signal<Set<number>>(new Set());

  filteredEditProducts = computed(() => {
    const q = this.editSearchTerm().toLowerCase();
    return this.categories().flatMap(c => c.products)
      .filter(p => p.available && (!q || p.name.toLowerCase().includes(q)))
      .slice(0, 15);
  });

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
  additionsAccepted = signal<boolean | null>(null);
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
    this.cart().reduce((sum, item) => sum + this.itemUnitPrice(item) * item.quantity, 0)
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

  loadEditableOrders(): void {
    this.loadingEditOrders.set(true);
    this.svc.getActiveOrders(getCurrentBusinessDayStartParam()).subscribe({
      next: data => {
        const active: OrderResponse['status'][] = ['RECEIVED', 'PREPARING', 'ON_THE_WAY'];
        this.editableOrders.set(
          data.filter(o => active.includes(o.status))
               .sort((a, b) => a.id - b.id)
        );
        this.loadingEditOrders.set(false);
      },
      error: () => this.loadingEditOrders.set(false)
    });
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
    const comboPrice = this.resolveComboPrice(product, combo);
    if (product.additions?.length) {
      this.additionsAccepted.set(null);
      this.selectedPendingAdditionIds.set(new Set());
      this.pendingAdditionsItem.set({ product, flavor, combo });
      return;
    }
    this.addProductToCart(product, flavor, '', 0, combo, comboPrice);
  }

  togglePendingAdditionId(id: number): void {
    this.selectedPendingAdditionIds.update(ids => {
      const next = new Set(ids);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  handlePendingAdditionsSelection(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const ids = Array.from(select.selectedOptions)
      .map(option => Number(option.value))
      .filter(id => !Number.isNaN(id));
    this.selectedPendingAdditionIds.set(new Set(ids));
  }

  confirmAdditions(): void {
    const item = this.pendingAdditionsItem();
    if (!item) return;
    if (this.additionsAccepted() === false) {
      this.pendingAdditionsItem.set(null);
      this.addProductToCart(
        item.product,
        item.flavor,
        '',
        0,
        item.combo,
        this.resolveComboPrice(item.product, item.combo)
      );
      return;
    }
    const selected = item.product.additions!.filter(a => this.selectedPendingAdditionIds().has(a.id));
    const additionsStr = selected.map(a => a.name).join(', ');
    const additionsPrice = selected.reduce((s, a) => s + a.effectivePrice, 0);
    this.pendingAdditionsItem.set(null);
    this.additionsAccepted.set(null);
    this.addProductToCart(
      item.product,
      item.flavor,
      additionsStr,
      additionsPrice,
      item.combo,
      this.resolveComboPrice(item.product, item.combo)
    );
  }

  cancelAdditions(): void {
    this.additionsAccepted.set(null);
    this.selectedPendingAdditionIds.set(new Set());
    this.pendingAdditionsItem.set(null);
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

  itemUnitPrice(item: CartItem): number {
    return item.product.price + item.additionsPrice + item.comboPrice;
  }

  private resolveComboPrice(product: CatalogProduct, combo: string): number {
    return combo ? (product.comboPrice ?? 0) : 0;
  }

  increaseQty(item: CartItem): void {
    this.cart.update(items => items.map(i =>
      i.product.id === item.product.id && i.flavor === item.flavor && i.additions === item.additions && i.combo === item.combo
        ? { ...i, quantity: i.quantity + 1 }
        : i
    ));
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
        unitPrice: this.itemUnitPrice(i),
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
      source: 'DELIVERY'
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

  openEdit(order: OrderResponse): void {
    this.editingOrder.set(order);
    this.editItems.set(order.items.map(i => ({ ...i })));
    this.editNotes.set(order.notes ?? '');
    this.editShowSearch.set(false);
    this.editSearchTerm.set('');
    this.editError.set('');
    if (this.categories().length === 0) {
      this.switchToOrder();
    }
  }

  closeEdit(): void {
    this.editingOrder.set(null);
  }

  updateEditItemField(index: number, field: 'flavor' | 'additions', value: string): void {
    this.editItems.update(list => {
      const next = [...list];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }

  updateEditQty(index: number, delta: number): void {
    this.editItems.update(list => {
      const newQty = list[index].quantity + delta;
      if (newQty < 1) return list.filter((_, i) => i !== index);
      const next = [...list];
      next[index] = { ...next[index], quantity: newQty };
      return next;
    });
  }

  addEditProduct(p: CatalogProduct): void {
    if (p.additions?.length) {
      this.editPendingProduct.set(p);
      this.editPendingAdditionIds.set(new Set());
      this.editShowSearch.set(false);
      return;
    }
    this.doAddEditProduct(p, '', 0);
  }

  toggleEditAdditionId(id: number): void {
    this.editPendingAdditionIds.update(ids => {
      const next = new Set(ids);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  confirmEditProduct(): void {
    const p = this.editPendingProduct();
    if (!p) return;
    const selected = (p.additions ?? []).filter(a => this.editPendingAdditionIds().has(a.id));
    const additionsStr = selected.map(a => a.name).join(', ');
    const additionsPrice = selected.reduce((s, a) => s + a.effectivePrice, 0);
    this.doAddEditProduct(p, additionsStr, additionsPrice);
    this.editPendingProduct.set(null);
  }

  private doAddEditProduct(p: CatalogProduct, additions: string, additionsPrice: number): void {
    this.editItems.update(list => {
      const idx = list.findIndex(i => i.productName === p.name && i.additions === additions);
      if (idx >= 0) {
        const next = [...list];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        return next;
      }
      return [...list, { id: 0, productId: p.id, productName: p.name, flavor: '', additions, quantity: 1, unitPrice: p.price + additionsPrice, subtotal: p.price + additionsPrice, note: '' }];
    });
    this.editShowSearch.set(false);
    this.editSearchTerm.set('');
  }

  saveEdit(): void {
    const order = this.editingOrder();
    if (!order || this.editItems().length === 0) return;
    this.savingEdit.set(true);
    this.editError.set('');

    const items: OrderItemRequest[] = this.editItems().map(i => ({
      productId: i.productId,
      productName: i.productName,
      flavor: i.flavor || undefined,
      additions: i.additions || undefined,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      note: i.note || undefined,
    }));

    this.svc.updateOrder(order.id, { items, notes: this.editNotes() }).subscribe({
      next: updated => {
        this.editableOrders.update(list => list.map(o => o.id === updated.id ? updated : o));
        this.orders.update(list => list.map(o => o.id === updated.id ? updated : o));
        this.savingEdit.set(false);
        this.editingOrder.set(null);
      },
      error: () => {
        this.savingEdit.set(false);
        this.editError.set('Error al guardar. Intenta de nuevo.');
      }
    });
  }

  waLink(whatsapp: string): string {
    const digits = whatsapp.replace(/\D/g, '');
    const number = digits.startsWith('57') ? digits : '57' + digits;
    return 'https://wa.me/' + number;
  }

  logout(): void {
    this.svc.logout();
    this.router.navigate(['/domicilio/login']);
  }
}
