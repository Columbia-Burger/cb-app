import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { CartComponent } from '../../components/cart/cart.component';
import { CartService } from '../../services/cart.service';
import { CatalogService } from '../../services/catalog.service';
import { MenuCategory, MenuItem, BaseOption } from '../../models/menu.model';

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

  canAddToCart = computed(() => {
    const item = this.selectedItem();
    if (!item) return false;
    if (item.baseOptions?.length && !this.selectedBaseOption()) return false;
    if (item.flavors?.length && !this.selectedFlavor()) return false;
    return true;
  });

  // Precio activo en el modal: base option si existe, sino precio del producto
  modalPrice = computed(() => {
    const base = this.selectedBaseOption();
    const item = this.selectedItem();
    if (!item) return '';
    if (base) return `$ ${base.priceValue.toLocaleString('es-CO')}`;
    return item.price;
  });

  modalPriceValue = computed(() => {
    const base = this.selectedBaseOption();
    const item = this.selectedItem();
    if (!item) return 0;
    return base ? base.priceValue : item.priceValue;
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
    document.body.style.overflow = 'hidden';
  }

  closeDetail(): void {
    this.selectedItem.set(null);
    this.selectedFlavor.set(null);
    this.selectedBaseOption.set(null);
    document.body.style.overflow = '';
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

    const parts = [item.name, base?.name, flavor].filter(Boolean);
    const name = parts.join(' — ');

    const priceValue = base ? base.priceValue : item.priceValue;
    const price = base ? `$ ${base.priceValue.toLocaleString('es-CO')}` : item.price;

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
