import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CurrencyPipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin.service';
import { CatalogProduct, CatalogCategory, FlavorItem } from '../../models/admin.model';

@Component({
  selector: 'app-admin-menu',
  standalone: true,
  imports: [CurrencyPipe, NgClass, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h2 class="page-title">Menú</h2>
          <p class="page-sub">Activa o desactiva productos para el agente y el menú público</p>
        </div>
        <div class="header-stats">
          <span class="stat active">{{ activeCount() }} activos</span>
          <span class="stat inactive">{{ inactiveCount() }} inactivos</span>
        </div>
      </div>

      <div class="search-bar">
        <input
          type="text"
          placeholder="Buscar producto..."
          [(ngModel)]="search"
        />
      </div>

      @if (loading()) {
        <div class="loading">
          <div class="spinner"></div>
          Cargando menú...
        </div>
      }

      @for (cat of filteredCategories(); track cat.id) {
        <div class="category-block">
          <div class="category-header">
            <h3 class="category-name">{{ cat.name }}</h3>
            <span class="category-count">{{ cat.products.length }} productos</span>
          </div>
          <div class="products-grid">
            @for (p of cat.products; track p.id) {
              <div class="product-card" [class.inactive]="!p.available">
                <div class="product-img-wrap">
                  <img [src]="p.imageUrl" [alt]="p.name" class="product-img" loading="lazy" />
                  @if (!p.available) {
                    <div class="unavailable-overlay">Inactivo</div>
                  }
                </div>
                <div class="product-info">
                  <span class="product-name">{{ p.name }}</span>
                  <span class="product-price">{{ p.price | currency:'COP':'symbol-narrow':'1.0-0' }}</span>
                </div>
                <div class="product-footer">
                  <button
                    class="toggle-btn"
                    [ngClass]="p.available ? 'toggle-on' : 'toggle-off'"
                    (click)="toggle(p)"
                    [disabled]="toggling.has(p.id)"
                  >
                    <span class="toggle-dot"></span>
                  </button>
                  <span class="toggle-label">{{ p.available ? 'Disponible' : 'No disponible' }}</span>
                  <button class="flavors-btn" (click)="openFlavorEditor(p); $event.stopPropagation()">
                    🏷️{{ p.flavors?.length ? ' ' + p.flavors.length : '' }}
                  </button>
                </div>
              </div>
            }
          </div>
        </div>
      }

      @if (!loading() && filteredCategories().length === 0) {
        <p class="empty">No se encontraron productos.</p>
      }

      @if (editingProduct()) {
        <div class="fl-overlay" (click)="editingProduct.set(null)">
          <div class="fl-sheet" (click)="$event.stopPropagation()">
            <div class="fl-title">Sabores — {{ editingProduct()!.name }}</div>
            @if (loadingFlavors()) {
              <p class="fl-loading">Cargando...</p>
            } @else {
              <div class="fl-options">
                @for (f of allFlavors(); track f.id) {
                  <label class="fl-option">
                    <input type="checkbox"
                           [checked]="selectedFlavorIds().has(f.id)"
                           (change)="toggleFlavorId(f.id)" />
                    <span>{{ f.name }}</span>
                  </label>
                }
              </div>
              <div class="fl-actions">
                <button class="fl-save" [disabled]="savingFlavors()" (click)="saveFlavors()">
                  {{ savingFlavors() ? 'Guardando...' : 'Guardar' }}
                </button>
                <button class="fl-cancel" (click)="editingProduct.set(null)">Cancelar</button>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    * { box-sizing: border-box; }
    .page { color: #c9d1d9; }

    .page-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1em;
      margin-bottom: 1.25em;
      flex-wrap: wrap;
    }
    .page-title { font-size: 1.5em; font-weight: 700; color: #e6edf3; margin: 0 0 0.2em; }
    .page-sub { color: #8b949e; font-size: 0.85em; margin: 0; }

    .header-stats { display: flex; gap: 0.6em; align-items: center; }
    .stat {
      font-size: 0.8em;
      font-weight: 600;
      padding: 0.3em 0.8em;
      border-radius: 20px;
    }
    .stat.active { background: rgba(63,185,80,0.15); color: #3fb950; }
    .stat.inactive { background: rgba(248,81,73,0.12); color: #f85149; }

    .search-bar { margin-bottom: 1.5em; }
    .search-bar input {
      width: 100%;
      max-width: 380px;
      padding: 0.65em 1em;
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 8px;
      color: #c9d1d9;
      font-size: 0.9em;
      outline: none;
      transition: border-color 0.2s;
    }
    .search-bar input:focus { border-color: #e94560; }

    .loading {
      display: flex;
      align-items: center;
      gap: 0.75em;
      color: #8b949e;
      padding: 3em 0;
    }
    .spinner {
      width: 20px; height: 20px;
      border: 2px solid #30363d;
      border-top-color: #e94560;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Category */
    .category-block { margin-bottom: 2.5em; }
    .category-header {
      display: flex;
      align-items: center;
      gap: 0.75em;
      margin-bottom: 1em;
      padding-bottom: 0.6em;
      border-bottom: 1px solid #21262d;
    }
    .category-name { font-size: 1em; font-weight: 700; color: #e6edf3; margin: 0; }
    .category-count { font-size: 0.75em; color: #8b949e; background: #21262d; padding: 0.2em 0.6em; border-radius: 20px; }

    /* Grid */
    .products-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 1em;
    }

    /* Card */
    .product-card {
      background: #161b22;
      border: 1px solid #21262d;
      border-radius: 12px;
      overflow: hidden;
      transition: opacity 0.2s, border-color 0.2s;
    }
    .product-card.inactive { opacity: 0.55; }
    .product-card:hover { border-color: #30363d; }

    .product-img-wrap { position: relative; aspect-ratio: 1; overflow: hidden; }
    .product-img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .unavailable-overlay {
      position: absolute;
      inset: 0;
      background: rgba(13,17,23,0.65);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75em;
      font-weight: 700;
      color: #f85149;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .product-info {
      padding: 0.7em 0.75em 0.4em;
      display: flex;
      flex-direction: column;
      gap: 0.15em;
    }
    .product-name { font-size: 0.82em; font-weight: 600; color: #e6edf3; line-height: 1.3; }
    .product-price { font-size: 0.78em; color: #8b949e; }

    .product-footer {
      padding: 0.5em 0.75em 0.7em;
      display: flex;
      align-items: center;
      gap: 0.6em;
    }
    .toggle-label { font-size: 0.72em; color: #8b949e; }

    /* Toggle switch */
    .toggle-btn {
      width: 36px; height: 20px;
      border-radius: 20px;
      border: none;
      cursor: pointer;
      position: relative;
      transition: background 0.2s;
      flex-shrink: 0;
      padding: 0;
    }
    .toggle-btn:disabled { cursor: wait; opacity: 0.6; }
    .toggle-on { background: #3fb950; }
    .toggle-off { background: #30363d; }
    .toggle-dot {
      position: absolute;
      top: 3px; left: 3px;
      width: 14px; height: 14px;
      border-radius: 50%;
      background: #fff;
      transition: transform 0.2s;
    }
    .toggle-on .toggle-dot { transform: translateX(16px); }

    .empty { color: #8b949e; text-align: center; padding: 3em; }

    .flavors-btn {
      margin-left: auto;
      background: none;
      border: 1px solid #30363d;
      border-radius: 6px;
      color: #8b949e;
      font-size: 0.7em;
      padding: 0.2em 0.5em;
      cursor: pointer;
      white-space: nowrap;
    }
    .flavors-btn:hover { border-color: #e94560; color: #e94560; }

    .fl-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.6);
      display: flex; align-items: flex-end; justify-content: center; z-index: 200;
    }
    .fl-sheet {
      background: #161b22; border: 1px solid #30363d; border-radius: 14px 14px 0 0;
      padding: 1.25em 1.25em 1.5em; width: 100%; max-width: 480px;
      max-height: 70vh; overflow-y: auto;
    }
    .fl-title { font-size: 1em; font-weight: 700; color: #e6edf3; margin-bottom: 1em; }
    .fl-loading { color: #8b949e; font-size: 0.85em; }
    .fl-options { display: flex; flex-direction: column; gap: 0.5em; margin-bottom: 1em; }
    .fl-option {
      display: flex; align-items: center; gap: 0.6em;
      padding: 0.6em 0.75em;
      background: #21262d; border-radius: 8px;
      cursor: pointer; font-size: 0.9em; color: #e6edf3;
    }
    .fl-option input { accent-color: #e94560; width: 16px; height: 16px; cursor: pointer; }
    .fl-actions { display: flex; gap: 0.75em; }
    .fl-save {
      flex: 1; padding: 0.75em; background: #e94560; color: #fff;
      border: none; border-radius: 8px; font-size: 0.9em; font-weight: 600; cursor: pointer;
    }
    .fl-save:disabled { opacity: 0.5; cursor: wait; }
    .fl-cancel {
      padding: 0.75em 1em; background: none; border: 1px solid #30363d;
      border-radius: 8px; color: #8b949e; font-size: 0.9em; cursor: pointer;
    }
  `]
})
export class AdminMenuComponent implements OnInit {
  private svc = inject(AdminService);

  loading = signal(true);
  products = signal<CatalogProduct[]>([]);
  toggling = new Set<number>();
  search = '';

  editingProduct = signal<CatalogProduct | null>(null);
  allFlavors = signal<FlavorItem[]>([]);
  selectedFlavorIds = signal<Set<number>>(new Set());
  loadingFlavors = signal(false);
  savingFlavors = signal(false);

  categories = computed<CatalogCategory[]>(() => {
    const map = new Map<number, CatalogCategory>();
    for (const p of this.products()) {
      if (!map.has(p.categoryId)) {
        map.set(p.categoryId, { id: p.categoryId, name: p.categoryName, products: [] });
      }
      map.get(p.categoryId)!.products.push(p);
    }
    return Array.from(map.values());
  });

  filteredCategories = computed<CatalogCategory[]>(() => {
    const q = this.search.toLowerCase().trim();
    if (!q) return this.categories();
    return this.categories()
      .map(cat => ({
        ...cat,
        products: cat.products.filter(p => p.name.toLowerCase().includes(q))
      }))
      .filter(cat => cat.products.length > 0);
  });

  activeCount = computed(() => this.products().filter(p => p.available).length);
  inactiveCount = computed(() => this.products().filter(p => !p.available).length);

  ngOnInit(): void {
    this.svc.getAdminProducts().subscribe({
      next: data => {
        this.products.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  openFlavorEditor(product: CatalogProduct): void {
    this.editingProduct.set(product);
    this.selectedFlavorIds.set(new Set(product.flavors?.map(f => f.id) ?? []));
    if (this.allFlavors().length === 0) {
      this.loadingFlavors.set(true);
      this.svc.getFlavors().subscribe({
        next: flavors => { this.allFlavors.set(flavors); this.loadingFlavors.set(false); },
        error: () => this.loadingFlavors.set(false)
      });
    }
  }

  toggleFlavorId(id: number): void {
    this.selectedFlavorIds.update(ids => {
      const next = new Set(ids);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  saveFlavors(): void {
    const product = this.editingProduct();
    if (!product) return;
    this.savingFlavors.set(true);
    this.svc.updateProductFlavors(product.id, [...this.selectedFlavorIds()]).subscribe({
      next: () => {
        const updatedFlavors = this.allFlavors().filter(f => this.selectedFlavorIds().has(f.id));
        this.products.update(list =>
          list.map(p => p.id === product.id ? { ...p, flavors: updatedFlavors } : p)
        );
        this.savingFlavors.set(false);
        this.editingProduct.set(null);
      },
      error: () => this.savingFlavors.set(false)
    });
  }

  toggle(product: CatalogProduct): void {
    this.toggling.add(product.id);
    this.svc.toggleProduct(product.id).subscribe({
      next: () => {
        this.products.update(list =>
          list.map(p => p.id === product.id ? { ...p, available: !p.available } : p)
        );
        this.toggling.delete(product.id);
      },
      error: () => this.toggling.delete(product.id)
    });
  }
}
