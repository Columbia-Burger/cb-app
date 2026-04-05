import { Component, inject } from '@angular/core';
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
    this.cart.addItem({
      name: item.name,
      price: item.price,
      priceValue: item.priceValue,
      image: item.image,
    });
  }
}
