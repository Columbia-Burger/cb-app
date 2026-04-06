import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { CartComponent } from '../../components/cart/cart.component';
import { CartService } from '../../services/cart.service';
import { MenuItem } from '../../models/menu.model';
import { MENU_CATEGORIES } from '../../data/menu.data';

@Component({
  selector: 'app-menu-page',
  standalone: true,
  imports: [RouterLink, HeaderComponent, FooterComponent, CartComponent],
  templateUrl: './menu-page.component.html',
  styleUrl: './menu-page.component.scss',
})
export class MenuPageComponent {
  readonly cart = inject(CartService);
  readonly categories = MENU_CATEGORIES;

  selectedItem = signal<MenuItem | null>(null);
  selectedFlavor = signal<string | null>(null);

  openDetail(item: MenuItem): void {
    this.selectedItem.set(item);
    this.selectedFlavor.set(item.flavors?.[0] ?? null);
    document.body.style.overflow = 'hidden';
  }

  closeDetail(): void {
    this.selectedItem.set(null);
    this.selectedFlavor.set(null);
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
    if (item.flavors?.length) {
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
    const flavor = this.selectedFlavor();
    const name = flavor ? `${item.name} — ${flavor}` : item.name;
    this.cart.addItem({
      name,
      price: item.price,
      priceValue: item.priceValue,
      image: item.image,
    });
    this.closeDetail();
  }
}
