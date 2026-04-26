import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { CartComponent } from '../../components/cart/cart.component';
import { CartService } from '../../services/cart.service';
import { CatalogService } from '../../services/catalog.service';
import { MenuCategory, MenuItem, BaseOption, MenuAddition } from '../../models/menu.model';

@Component({
  selector: 'app-menu-page',
  standalone: true,
  imports: [RouterLink, FormsModule, HeaderComponent, FooterComponent, CartComponent],
  templateUrl: './menu-page.component.html',
  styleUrl: './menu-page.component.scss',
})
export class MenuPageComponent implements OnInit {
  readonly cart = inject(CartService);
  readonly catalog = inject(CatalogService);

  categories = signal<MenuCategory[]>([]);
  loading = signal(true);
  readonly skeletonItems = Array.from({ length: 8 }, (_, i) => i);

  selectedItem = signal<MenuItem | null>(null);
  selectedFlavor = signal<string | null>(null);
  selectedBaseOption = signal<BaseOption | null>(null);
  selectedAdditionIds = signal<Set<number>>(new Set());
  comboAccepted = signal<boolean | null>(null);
  comboDrink = signal('');
  comboDrinkFlavor = signal('');

  comboDrinks = signal<{ label: string; flavors: string[] }[]>([]);

  selectedComboDrinkFlavors = computed(() =>
    this.comboDrinks().find(d => d.label === this.comboDrink())?.flavors ?? []
  );

  canAddToCart = computed(() => {
    const item = this.selectedItem();
    if (!item) return false;
    if (item.baseOptions?.length && !this.selectedBaseOption()) return false;
    if (item.flavors?.length && !this.selectedFlavor()) return false;
    if (item.comboDescription) {
      const accepted = this.comboAccepted();
      if (accepted === null) return false;
      if (accepted && (!this.comboDrink() || !this.comboDrinkFlavor())) return false;
    }
    return true;
  });

  // Precio activo en el modal: base + adiciones seleccionadas + combo si aplica
  modalPriceValue = computed(() => {
    const item = this.selectedItem();
    if (!item) return 0;
    const base = this.selectedBaseOption()?.priceValue ?? item.priceValue;
    const additionsTotal = item.additions
      ?.filter(a => this.selectedAdditionIds().has(a.id))
      .reduce((s, a) => s + a.effectivePrice, 0) ?? 0;
    const comboTotal = this.comboAccepted() ? (item.comboPrice ?? 0) : 0;
    return base + additionsTotal + comboTotal;
  });

  modalPrice = computed(() => {
    const v = this.modalPriceValue();
    return `$ ${v.toLocaleString('es-CO')}`;
  });

  ngOnInit(): void {
    this.catalog.getMenuCategories().subscribe({
      next: cats => {
        this.categories.set(cats);
        const drinkNames = ['Gaseosa Postobón 400ml', 'Jugo Hit 500ml'];
        this.comboDrinks.set(
          cats.flatMap(c => c.items)
            .filter(p => drinkNames.includes(p.name))
            .map(p => ({ label: p.name, flavors: p.flavors ?? [] }))
        );
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  openDetail(item: MenuItem): void {
    this.selectedItem.set(item);
    this.selectedFlavor.set(item.flavors?.[0] ?? null);
    this.selectedBaseOption.set(item.baseOptions?.[0] ?? null);
    this.selectedAdditionIds.set(new Set());
    this.comboAccepted.set(item.comboDescription ? null : false);
    this.comboDrink.set('');
    this.comboDrinkFlavor.set('');
    document.body.style.overflow = 'hidden';
  }

  closeDetail(): void {
    this.selectedItem.set(null);
    this.selectedFlavor.set(null);
    this.selectedBaseOption.set(null);
    this.selectedAdditionIds.set(new Set());
    this.comboAccepted.set(null);
    this.comboDrink.set('');
    this.comboDrinkFlavor.set('');
    document.body.style.overflow = '';
  }

  toggleAddition(id: number): void {
    this.selectedAdditionIds.update(ids => {
      const next = new Set(ids);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  scrollTo(id: string): void {
    const el = document.getElementById(id);
    if (!el) return;
    const header = document.querySelector('.header') as HTMLElement;
    const categoryNav = document.querySelector('.category-nav') as HTMLElement;
    const offset = (header?.offsetHeight ?? 0) + (categoryNav?.offsetHeight ?? 0) + 16;
    const top = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  }

  addToCart(item: MenuItem): void {
    this.openDetail(item);
  }

  addToCartFromDetail(item: MenuItem): void {
    const base = this.selectedBaseOption();
    const flavor = this.selectedFlavor();
    const selectedAdditions = item.additions?.filter(a => this.selectedAdditionIds().has(a.id)) ?? [];
    const accepted = this.comboAccepted();
    const comboStr = accepted && item.comboDescription
      ? `Combo (${item.comboDescription}) — ${this.comboDrink()} ${this.comboDrinkFlavor()}`
      : null;

    const parts = [
      item.name,
      base?.name,
      flavor,
      selectedAdditions.length ? selectedAdditions.map(a => a.name).join(', ') : null,
      comboStr,
    ].filter(Boolean);
    const name = parts.join(' — ');

    const priceValue = this.modalPriceValue();
    const price = this.modalPrice();

    this.cart.addItem({ name, price, priceValue, image: item.image });
    this.closeDetail();
  }

  priceRange(item: MenuItem): string {
    if (!item.baseOptions?.length) return item.price;
    const prices = item.baseOptions.map(o => o.priceValue);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return `$ ${min.toLocaleString('es-CO')} - $ ${max.toLocaleString('es-CO')}`;
  }
}
