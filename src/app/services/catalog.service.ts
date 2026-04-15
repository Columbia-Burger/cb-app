import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { CategoryResponse, ProductResponse, SeasonalSpecialResponse } from '../models/api.model';
import { MenuCategory, MenuItem, BaseOption } from '../models/menu.model';
import { SpecialProduct } from '../data/featured.data';


// Opciones de base con precio para productos específicos
const PRODUCT_BASES: Record<string, { name: string; priceValue: number }[]> = {
  'Jugo Natural': [
    { name: 'Leche', priceValue: 8500 },
    { name: 'Agua',  priceValue: 6500 },
  ],
};

const CATEGORY_ICONS: Record<string, string> = {
  'Hamburguesas': '🍔',
  'Perros Calientes': '🌭',
  'Salchipapas': '🍟',
  'Costillas': '🥩',
  'Dorilocos': '🌽',
  'Parrilla': '🔥',
  'Mazorcadas': '🫘',
  'Patacones': '🫓',
  'Pizzas Personales': '🍕',
  'Bebidas': '🥤',
};

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  getMenuCategories(): Observable<MenuCategory[]> {
    return forkJoin({
      categories: this.http.get<CategoryResponse[]>(`${this.base}/api/categories`),
      products: this.http.get<ProductResponse[]>(`${this.base}/api/products?availableOnly=true`),
    }).pipe(
      map(({ categories, products }) =>
        categories
          .filter(c => c.active)
          .map(c => ({
            id: this.toSlug(c.name),
            title: c.name,
            icon: CATEGORY_ICONS[c.name] ?? '🍽️',
            items: products
              .filter(p => p.categoryId === c.id)
              .map(p => this.toMenuItem(p)),
          }))
          .filter(c => c.items.length > 0)
      )
    );
  }

  getActiveSpecial(): Observable<SpecialProduct | null> {
    return this.http
      .get<SeasonalSpecialResponse[]>(`${this.base}/api/seasonal-specials?currentOnly=true`)
      .pipe(
        map(specials => {
          const s = specials.find(x => x.active) ?? null;
          if (!s) return null;
          return {
            name: s.name,
            tagline: s.tagline,
            description: s.description,
            price: this.formatPrice(s.price),
            priceValue: s.price,
            image: s.imageUrl,
          };
        })
      );
  }

  private toMenuItem(p: ProductResponse): MenuItem {
    const baseOptions: BaseOption[] | undefined = PRODUCT_BASES[p.name];
    const flavors = p.flavors?.map(f => f.name);
    return {
      name: p.name,
      description: p.description,
      price: this.formatPrice(p.price),
      priceValue: p.price,
      image: p.imageUrl,
      ...(baseOptions ? { baseOptions } : {}),
      ...(flavors?.length ? { flavors } : {}),
    };
  }

  private formatPrice(value: number): string {
    return `$ ${value.toLocaleString('es-CO')}`;
  }

  private toSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-');
  }
}
