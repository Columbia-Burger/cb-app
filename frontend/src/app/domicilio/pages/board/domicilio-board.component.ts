import { Component, inject, signal, computed, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { isCurrentBusinessDayOrder, getCurrentBusinessDayStartParam } from '../../../shared/business-hours';
import { DomicilioService } from '../../services/domicilio.service';
import { OrderResponse, OrderItemResponse, CatalogProduct, OrderItemRequest } from '../../../admin/models/admin.model';
import { OrderEvent, OrderEventsService } from '../../../services/order-events.service';
import { OrderBuilderComponent, TABLES } from '../../../shared/order-builder/order-builder.component';
import { IconComponent } from '../../../shared/icon.component';

interface ZoneOption { name: string; price: number; }
const PICKUP_OPTION: ZoneOption = { name: 'Recoger aquí', price: 0 };

@Component({
    selector: 'app-domicilio-board',
    imports: [CurrencyPipe, DatePipe, FormsModule, OrderBuilderComponent, IconComponent],
    templateUrl: './domicilio-board.component.html',
    styleUrl: './domicilio-board.component.scss'
})
export class DomicilioBoardComponent implements OnInit, OnDestroy {
  private svc = inject(DomicilioService);
  private orderEvents = inject(OrderEventsService);
  private router = inject(Router);

  @ViewChild(OrderBuilderComponent) builder?: OrderBuilderComponent;

  // ── Vista activa ──────────────────────────────────────────────
  view = signal<'deliveries' | 'order' | 'edit'>('deliveries');

  // ── Domicilios ────────────────────────────────────────────────
  orders = signal<OrderResponse[]>([]);
  loadingDeliveries = signal(true);
  updating = new Set<number>();
  private eventSub?: Subscription;

  // ── Menú (lo usan Tomar pedido y Editar) ──────────────────────
  loadingMenu = signal(true);
  products = signal<CatalogProduct[]>([]);
  private menuRequested = false;

  // ── Tomar pedido ──────────────────────────────────────────────
  readonly tables = TABLES;
  submitting = signal(false);
  successMsg = signal('');
  errorMsg = signal('');
  orderType = signal<'mesa' | 'llevar' | ''>('');
  tableNumber = signal('');
  selectedZoneName = signal('');
  deliveryZones = signal<ZoneOption[]>([PICKUP_OPTION]);

  selectedZone = computed(() => this.deliveryZones().find(z => z.name === this.selectedZoneName()) ?? null);
  deliveryFee = computed(() => (this.orderType() === 'llevar' ? this.selectedZone()?.price ?? 0 : 0));
  canSubmit = computed(() => {
    const type = this.orderType();
    return !this.submitting()
      && (type === 'mesa' ? !!this.tableNumber() : type === 'llevar' ? !!this.selectedZoneName() : false);
  });

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
    return this.products()
      .filter(p => p.available && (!q || p.name.toLowerCase().includes(q)))
      .slice(0, 15);
  });

  editTotal = computed(() => this.editItems().reduce((s, i) => s + i.unitPrice * i.quantity, 0));

  ngOnInit(): void {
    this.loadDeliveries();
    this.eventSub = this.orderEvents.connect(this.svc.getToken()).subscribe({
      next: event => this.applyOrderEvent(event),
    });
  }

  ngOnDestroy(): void {
    this.eventSub?.unsubscribe();
  }

  // ── Domicilios ────────────────────────────────────────────────

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

  waLink(whatsapp: string): string {
    const digits = whatsapp.replace(/\D/g, '');
    const number = digits.startsWith('57') ? digits : '57' + digits;
    return 'https://wa.me/' + number;
  }

  /** Los pedidos tomados en el local guardan un identificador interno, no un teléfono. */
  isPhone(whatsapp: string | null | undefined): boolean {
    return !!whatsapp && /\d{7,}/.test(whatsapp);
  }

  // ── Menú ──────────────────────────────────────────────────────

  private ensureMenu(): void {
    if (this.menuRequested) return;
    this.menuRequested = true;
    this.svc.getMenu().subscribe({
      next: products => { this.products.set(products); this.loadingMenu.set(false); },
      error: () => { this.loadingMenu.set(false); this.menuRequested = false; }
    });
    this.svc.getDeliveryZones().subscribe({
      next: zones => this.deliveryZones.set([PICKUP_OPTION, ...zones.map(z => ({ name: z.name, price: z.deliveryFee }))])
    });
  }

  // ── Tomar pedido ──────────────────────────────────────────────

  switchToOrder(): void {
    this.view.set('order');
    this.ensureMenu();
  }

  submitOrder(): void {
    const builder = this.builder;
    const type = this.orderType();
    if (!builder || !this.canSubmit() || builder.itemCount() === 0) return;

    this.submitting.set(true);
    this.successMsg.set('');
    this.errorMsg.set('');
    const zone = this.selectedZone();
    const notes = type === 'mesa' ? this.tableNumber() : 'Para llevar';

    this.svc.createOrder({
      customerName: 'Domiciliario',
      customerWhatsapp: 'DOMICILIO-WAITER',
      items: builder.buildItems(),
      notes,
      deliveryZone: type === 'llevar' ? zone?.name : undefined,
      deliveryFee: type === 'llevar' ? (zone?.price ?? 0) : undefined,
      printAtAdmin: true,
      source: 'WAITER'
    }).subscribe({
      next: order => {
        this.successMsg.set(`Pedido #${order.id} — ${notes}`);
        builder.clear();
        this.orderType.set('');
        this.tableNumber.set('');
        this.selectedZoneName.set('');
        this.submitting.set(false);
      },
      error: () => {
        this.errorMsg.set('Error al crear el pedido. Intenta de nuevo.');
        this.submitting.set(false);
      }
    });
  }

  // ── Editar pedido ─────────────────────────────────────────────

  switchToEdit(): void {
    this.view.set('edit');
    this.loadEditableOrders();
    this.ensureMenu();
  }

  loadEditableOrders(): void {
    this.loadingEditOrders.set(true);
    this.svc.getActiveOrders(getCurrentBusinessDayStartParam()).subscribe({
      next: data => {
        const active: OrderResponse['status'][] = ['RECEIVED', 'PREPARING', 'ON_THE_WAY'];
        this.editableOrders.set(data.filter(o => active.includes(o.status)).sort((a, b) => a.id - b.id));
        this.loadingEditOrders.set(false);
      },
      error: () => this.loadingEditOrders.set(false)
    });
  }

  statusLabel(status: OrderResponse['status']): string {
    return status === 'ON_THE_WAY' ? 'En camino' : status === 'PREPARING' ? 'Preparando' : 'Recibido';
  }

  openEdit(order: OrderResponse): void {
    this.editingOrder.set(order);
    this.editItems.set(order.items.map(i => ({ ...i })));
    this.editNotes.set(order.notes ?? '');
    this.editShowSearch.set(false);
    this.editSearchTerm.set('');
    this.editError.set('');
    this.ensureMenu();
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
      error: err => {
        this.savingEdit.set(false);
        this.editError.set(err?.error?.message ?? 'Error al guardar. Intenta de nuevo.');
      }
    });
  }

  logout(): void {
    this.svc.logout();
    this.router.navigate(['/domicilio/login']);
  }
}
