import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { CartComponent } from '../../components/cart/cart.component';
import { CartService } from '../../services/cart.service';
import { CatalogService } from '../../services/catalog.service';
import { MenuCategory, MenuItem, BaseOption, MenuAddition } from '../../models/menu.model';

@Component({
  selector: 'app-menu-page',
  standalone: true,
  imports: [RouterLink, HeaderComponent, FooterComponent, CartComponent],
  templateUrl: './menu-page.component.html',
  styleUrl: './menu-page.component.scss',
})
export class MenuPageComponent implements OnInit {
  readonly cart = inject(CartService);
  private readonly catalog = inject(CatalogService);

  categories = signal<MenuCategory[]>([]);
  loading = signal(true);

  selectedItem = signal<MenuItem | null>(null);
  selectedFlavor = signal<string | null>(null);
  selectedBaseOption = signal<BaseOption | null>(null);
  selectedAdditionIds = signal<Set<number>>(new Set());
  selectedCombo = signal<boolean | null>(null);

  canAddToCart = computed(() => {
    const item = this.selectedItem();
    if (!item) return false;
    if (item.baseOptions?.length && !this.selectedBaseOption()) return false;
    if (item.flavors?.length && !this.selectedFlavor()) return false;
    if (item.comboDescription && this.selectedCombo() === null) return false;
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
    const comboTotal = this.selectedCombo() ? (item.comboPrice ?? 0) : 0;
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
    this.selectedCombo.set(item.comboDescription ? null : false);
    document.body.style.overflow = 'hidden';
  }

  closeDetail(): void {
    this.selectedItem.set(null);
    this.selectedFlavor.set(null);
    this.selectedBaseOption.set(null);
    this.selectedAdditionIds.set(new Set());
    this.selectedCombo.set(null);
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
    if (item.flavors?.length || item.baseOptions?.length) {
      this.openDetail(item);
      return;
    }
    this.cart.addItem({
      name: item.name,
      price: item.price,
      priceValue: item.priceValue,
      image: item.image,
    });
  }

  addToCartFromDetail(item: MenuItem): void {
    const base = this.selectedBaseOption();
    const flavor = this.selectedFlavor();
    const selectedAdditions = item.additions?.filter(a => this.selectedAdditionIds().has(a.id)) ?? [];
    const comboAccepted = this.selectedCombo();

    const parts = [
      item.name,
      base?.name,
      flavor,
      selectedAdditions.length ? selectedAdditions.map(a => a.name).join(', ') : null,
      comboAccepted && item.comboDescription ? `Combo (${item.comboDescription})` : null,
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
