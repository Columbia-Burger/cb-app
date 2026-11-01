import { Component, computed, effect, input, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CatalogProduct, OrderItemRequest } from '../../admin/models/admin.model';

interface MenuCategory {
  id: number;
  name: string;
  products: CatalogProduct[];
}

interface ComboChoice {
  drink: string;
  flavor: string;
}

export interface CartItem {
  uid: number;
  product: CatalogProduct;
  flavor: string;
  additionIds: number[];
  combo: ComboChoice | null;
  quantity: number;
  note: string;
}

/** Qué se está editando en la hoja inferior (combo o adiciones de una línea del carrito). */
interface ExtrasEditor {
  kind: 'combo' | 'additions';
  uid: number;
  /** Si la línea tiene varias unidades: aplicar el cambio a una sola o a todas. */
  applyToAll: boolean;
  drink: string;
  drinkFlavor: string;
  additionIds: Set<number>;
}

/** Mesas y barras del local para pedidos tomados en sitio. */
export const TABLES = ['Barra 1', 'Barra 2', 'Barra 3', 'Barra 4', 'Mesa 1', 'Mesa 2'];

const COMBO_DRINK_NAMES = ['Gaseosa Postobón 400ml', 'Jugo Hit 500ml'];
const LAST_COMBO_KEY = 'cb_mesero_last_combo';

/**
 * Armado rápido de pedidos ("agrega primero, ajusta después"), compartido por Tomar pedido del
 * panel y de la app de domicilio. Tocar un producto lo agrega; combo y adiciones se marcan en la
 * línea solo si el cliente los pide. La pantalla que lo usa pone el tipo de pedido (proyectado en
 * [builderHeader]) y el total/botón de enviar ([builderFooter]), y lee buildItems() al enviar.
 */
@Component({
  selector: 'app-order-builder',
  imports: [CurrencyPipe, FormsModule],
  templateUrl: './order-builder.component.html',
  styleUrl: './order-builder.component.scss',
})
export class OrderBuilderComponent {
  products = input<CatalogProduct[]>([]);
  /** Valor del domicilio elegido por la pantalla, solo para el total de la barra del celular. */
  deliveryFee = input(0);

  private nextUid = 1;

  categories = computed<MenuCategory[]>(() => {
    const map = new Map<number, MenuCategory>();
    for (const p of this.products()) {
      if (!map.has(p.categoryId)) map.set(p.categoryId, { id: p.categoryId, name: p.categoryName, products: [] });
      map.get(p.categoryId)!.products.push(p);
    }
    return [...map.values()];
  });

  comboDrinks = computed(() =>
    this.products()
      .filter(p => COMBO_DRINK_NAMES.includes(p.name))
      .map(p => ({ label: p.name, flavors: p.flavors?.map(f => f.name) ?? [] }))
  );

  selectedCat = signal(0);
  cart = signal<CartItem[]>([]);
  /** Producto con sabores esperando que se elija el sabor (único paso obligatorio). */
  pendingProduct = signal<CatalogProduct | null>(null);
  editor = signal<ExtrasEditor | null>(null);
  /** Línea recién agregada, para resaltarla un instante. */
  flashUid = signal<number | null>(null);

  currentProducts = computed(() =>
    this.categories().find(c => c.id === this.selectedCat())?.products ?? []
  );

  itemCount = computed(() => this.cart().reduce((s, i) => s + i.quantity, 0));

  total = computed(() =>
    this.cart().reduce((sum, item) => sum + this.itemUnitPrice(item) * item.quantity, 0)
  );

  editingItem = computed(() => {
    const ed = this.editor();
    return ed ? this.cart().find(i => i.uid === ed.uid) ?? null : null;
  });

  editorDrinkFlavors = computed(() => {
    const ed = this.editor();
    return this.comboDrinks().find(d => d.label === ed?.drink)?.flavors ?? [];
  });

  canSaveCombo = computed(() => {
    const ed = this.editor();
    if (!ed || ed.kind !== 'combo' || !ed.drink) return false;
    return this.editorDrinkFlavors().length === 0 || !!ed.drinkFlavor;
  });

  /** Precio que tendrá una unidad con lo que está marcado en la hoja (vista previa). */
  editorUnitPreview = computed(() => {
    const ed = this.editor();
    const item = this.editingItem();
    if (!ed || !item) return 0;
    const preview: CartItem = ed.kind === 'combo'
      ? { ...item, combo: { drink: ed.drink, flavor: ed.drinkFlavor } }
      : { ...item, additionIds: [...ed.additionIds] };
    return this.itemUnitPrice(preview);
  });

  constructor() {
    // Al llegar el menú, abrir la primera categoría
    effect(() => {
      const cats = this.categories();
      if (cats.length && !cats.some(c => c.id === this.selectedCat())) this.selectedCat.set(cats[0].id);
    });
  }

  // ── API para la pantalla que lo usa ──────────────────────────

  /** Ítems listos para crear el pedido, con el mismo texto que leen cocina y el ticket. */
  buildItems(): OrderItemRequest[] {
    return this.cart().map(i => {
      const combo = i.combo ? `Combo (${i.product.comboDescription}) — ${this.comboLabel(i)}` : '';
      const allExtras = [this.additionsLabel(i), combo].filter(Boolean).join(', ');
      return {
        productId: i.product.id,
        productName: i.product.name,
        flavor: i.flavor || undefined,
        additions: allExtras || undefined,
        quantity: i.quantity,
        unitPrice: this.itemUnitPrice(i),
        note: i.note || undefined,
      };
    });
  }

  clear(): void {
    this.cart.set([]);
    this.editor.set(null);
    this.pendingProduct.set(null);
  }

  // ── Agregar productos: un toque ──────────────────────────────

  addToCart(product: CatalogProduct): void {
    if (!product.available) return;
    if (product.flavors?.length) {
      this.pendingProduct.set(product);
      return;
    }
    this.addPlain(product, '');
  }

  pickFlavor(flavor: string): void {
    const product = this.pendingProduct();
    if (!product) return;
    this.pendingProduct.set(null);
    this.addPlain(product, flavor);
  }

  /** Agrega sin extras; si ya hay una línea igual sin extras, solo sube la cantidad. */
  private addPlain(product: CatalogProduct, flavor: string): void {
    const existing = this.cart().find(i =>
      i.product.id === product.id && i.flavor === flavor && !i.combo && i.additionIds.length === 0
    );
    if (existing) {
      this.updateItem(existing.uid, i => ({ ...i, quantity: i.quantity + 1 }));
      this.flash(existing.uid);
      return;
    }
    const uid = this.nextUid++;
    this.cart.update(items => [...items, {
      uid, product, flavor, additionIds: [], combo: null, quantity: 1, note: '',
    }]);
    this.flash(uid);
  }

  // ── Combo y adiciones: solo si se piden ──────────────────────

  openCombo(item: CartItem): void {
    const last = this.readLastCombo();
    const current = item.combo ?? last;
    const drinkExists = !!current && this.comboDrinks().some(d => d.label === current.drink);
    this.editor.set({
      kind: 'combo',
      uid: item.uid,
      applyToAll: true,
      drink: drinkExists ? current!.drink : (this.comboDrinks()[0]?.label ?? ''),
      drinkFlavor: drinkExists ? current!.flavor : '',
      additionIds: new Set(item.additionIds),
    });
  }

  openAdditions(item: CartItem): void {
    this.editor.set({
      kind: 'additions',
      uid: item.uid,
      applyToAll: true,
      drink: '',
      drinkFlavor: '',
      additionIds: new Set(item.additionIds),
    });
  }

  setEditor(patch: Partial<ExtrasEditor>): void {
    this.editor.update(ed => (ed ? { ...ed, ...patch } : ed));
  }

  pickDrink(drink: string): void {
    const flavors = this.comboDrinks().find(d => d.label === drink)?.flavors ?? [];
    this.setEditor({ drink, drinkFlavor: flavors.length === 1 ? flavors[0] : '' });
  }

  toggleAddition(id: number): void {
    this.editor.update(ed => {
      if (!ed) return ed;
      const ids = new Set(ed.additionIds);
      ids.has(id) ? ids.delete(id) : ids.add(id);
      return { ...ed, additionIds: ids };
    });
  }

  saveExtras(): void {
    const ed = this.editor();
    const item = this.editingItem();
    if (!ed || !item) return;
    if (ed.kind === 'combo') {
      if (!this.canSaveCombo()) return;
      const combo = { drink: ed.drink, flavor: ed.drinkFlavor };
      this.saveLastCombo(combo);
      this.applyChange(item, ed.applyToAll, i => ({ ...i, combo }));
    } else {
      const ids = [...ed.additionIds].sort((a, b) => a - b);
      this.applyChange(item, ed.applyToAll, i => ({ ...i, additionIds: ids }));
    }
    this.editor.set(null);
  }

  removeCombo(): void {
    const ed = this.editor();
    const item = this.editingItem();
    if (!ed || !item) return;
    this.applyChange(item, ed.applyToAll, i => ({ ...i, combo: null }));
    this.editor.set(null);
  }

  /** Aplica el cambio a toda la línea o separa una unidad con el cambio. */
  private applyChange(item: CartItem, applyToAll: boolean, change: (i: CartItem) => CartItem): void {
    if (applyToAll || item.quantity === 1) {
      this.updateItem(item.uid, change);
      this.mergeDuplicates(item.uid);
      return;
    }
    const uid = this.nextUid++;
    this.cart.update(items => {
      const idx = items.findIndex(i => i.uid === item.uid);
      const reduced = { ...items[idx], quantity: items[idx].quantity - 1 };
      const single = change({ ...items[idx], uid, quantity: 1, note: '' });
      return [...items.slice(0, idx), reduced, single, ...items.slice(idx + 1)];
    });
    this.mergeDuplicates(uid);
  }

  /** Si la línea quedó igual a otra (mismo producto, sabor y extras), las une. */
  private mergeDuplicates(uid: number): void {
    const items = this.cart();
    const target = items.find(i => i.uid === uid);
    if (!target) return;
    const twin = items.find(i => i.uid !== uid && this.sameConfig(i, target));
    if (!twin) return;
    this.cart.set(items
      .filter(i => i.uid !== uid)
      .map(i => (i.uid === twin.uid
        ? { ...i, quantity: i.quantity + target.quantity, note: i.note || target.note }
        : i)));
  }

  private sameConfig(a: CartItem, b: CartItem): boolean {
    return a.product.id === b.product.id
      && a.flavor === b.flavor
      && a.additionIds.join(',') === b.additionIds.join(',')
      && (a.combo?.drink ?? '') === (b.combo?.drink ?? '')
      && (a.combo?.flavor ?? '') === (b.combo?.flavor ?? '');
  }

  // ── Carrito ──────────────────────────────────────────────────

  private updateItem(uid: number, change: (i: CartItem) => CartItem): void {
    this.cart.update(items => items.map(i => (i.uid === uid ? change(i) : i)));
  }

  increaseQty(item: CartItem): void {
    this.updateItem(item.uid, i => ({ ...i, quantity: i.quantity + 1 }));
  }

  decreaseQty(item: CartItem): void {
    if (item.quantity <= 1) {
      this.removeFromCart(item);
      return;
    }
    this.updateItem(item.uid, i => ({ ...i, quantity: i.quantity - 1 }));
  }

  removeFromCart(item: CartItem): void {
    this.cart.update(items => items.filter(i => i.uid !== item.uid));
  }

  setNote(item: CartItem, note: string): void {
    this.updateItem(item.uid, i => ({ ...i, note }));
  }

  quantityInCart(product: CatalogProduct): number {
    return this.cart().filter(i => i.product.id === product.id).reduce((s, i) => s + i.quantity, 0);
  }

  hasExtras(product: CatalogProduct): boolean {
    return !!product.comboDescription || !!product.additions?.length;
  }

  selectedAdditions(item: CartItem) {
    return (item.product.additions ?? []).filter(a => item.additionIds.includes(a.id));
  }

  additionsLabel(item: CartItem): string {
    return this.selectedAdditions(item).map(a => a.name).join(', ');
  }

  comboLabel(item: CartItem): string {
    if (!item.combo) return '';
    return `${item.combo.drink}${item.combo.flavor ? ' ' + item.combo.flavor : ''}`;
  }

  itemUnitPrice(item: CartItem): number {
    const additions = this.selectedAdditions(item).reduce((s, a) => s + a.effectivePrice, 0);
    const combo = item.combo ? (item.product.comboPrice ?? 0) : 0;
    return item.product.price + additions + combo;
  }

  private flash(uid: number): void {
    this.flashUid.set(uid);
    setTimeout(() => {
      if (this.flashUid() === uid) this.flashUid.set(null);
    }, 700);
  }

  private readLastCombo(): ComboChoice | null {
    try {
      const raw = localStorage.getItem(LAST_COMBO_KEY);
      return raw ? JSON.parse(raw) as ComboChoice : null;
    } catch {
      return null;
    }
  }

  private saveLastCombo(combo: ComboChoice): void {
    try {
      localStorage.setItem(LAST_COMBO_KEY, JSON.stringify(combo));
    } catch {
      // Sin almacenamiento solo se pierde la sugerencia
    }
  }
}
