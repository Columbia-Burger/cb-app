import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CurrencyPipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin.service';
import { CatalogProduct, CatalogCategory, FlavorItem, AdditionItem, CategoryItem, CreateProductRequest } from '../../models/admin.model';

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
        <div class="header-right">
          <div class="header-stats">
            <span class="stat active">{{ activeCount() }} activos</span>
            <span class="stat inactive">{{ inactiveCount() }} inactivos</span>
          </div>
          <button class="create-btn" (click)="openCreateModal()">+ Nuevo producto</button>
        </div>
      </div>

      <div class="search-bar">
        <input
          type="text"
          placeholder="Buscar producto..."
          [ngModel]="search()"
          (ngModelChange)="search.set($event)"
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
                    [disabled]="toggling().has(p.id)"
                  >
                    <span class="toggle-dot"></span>
                  </button>
                  <span class="toggle-label">{{ p.available ? 'Disponible' : 'No disponible' }}</span>
                  <div class="action-btns">
                    @if (cat.name.toLowerCase().includes('bebida')) {
                      <button class="flavors-btn" (click)="openFlavorEditor(p); $event.stopPropagation()">
                        🏷️{{ p.flavors?.length ? ' ' + p.flavors!.length : '' }}
                      </button>
                    }
                    <button class="additions-btn" (click)="openAdditionEditor(p); $event.stopPropagation()">
                      🧩{{ p.additions?.length ? ' ' + p.additions!.length : '' }}
                    </button>
                    <button class="combo-btn" [class.combo-active]="p.comboDescription" (click)="openComboEditor(p); $event.stopPropagation()">
                      🍟
                    </button>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      }

      @if (toggleError()) {
        <div class="toggle-error">⚠️ {{ toggleError() }}</div>
      }

      @if (!loading() && filteredCategories().length === 0) {
        <p class="empty">No se encontraron productos.</p>
      }

      <!-- Combo editor modal -->
      @if (editingProductCombo()) {
        <div class="fl-overlay" (click)="editingProductCombo.set(null)">
          <div class="fl-sheet" (click)="$event.stopPropagation()">
            <div class="fl-title">Combo — {{ editingProductCombo()!.name }}</div>
            @if (editingProductCombo()!.comboDescription) {
              <p class="combo-current">
                Actual: <strong>{{ editingProductCombo()!.comboDescription }}</strong>
                (+{{ editingProductCombo()!.comboPrice! | currency:'COP':'symbol-narrow':'1.0-0' }})
              </p>
            }
            <div class="combo-form">
              <label class="combo-field">
                <span class="combo-label">Descripción (ej: papas + gaseosa personal)</span>
                <input type="text" [(ngModel)]="comboForm.description" placeholder="papas + gaseosa personal" />
              </label>
              <label class="combo-field">
                <span class="combo-label">Precio adicional (COP)</span>
                <input type="number" [(ngModel)]="comboForm.price" min="0" placeholder="0" />
              </label>
            </div>
            <div class="fl-actions">
              <button class="fl-save" [disabled]="savingCombo()" (click)="saveCombo()">
                {{ savingCombo() ? 'Guardando...' : 'Asignar combo' }}
              </button>
              @if (editingProductCombo()!.comboDescription) {
                <button class="fl-remove" [disabled]="savingCombo()" (click)="removeCombo()">Quitar</button>
              }
              <button class="fl-cancel" (click)="editingProductCombo.set(null)">Cancelar</button>
            </div>
          </div>
        </div>
      }

      <!-- Additions editor modal -->
      @if (editingProductAdditions()) {
        <div class="fl-overlay" (click)="editingProductAdditions.set(null)">
          <div class="fl-sheet" (click)="$event.stopPropagation()">
            <div class="fl-title">Adiciones — {{ editingProductAdditions()!.name }}</div>
            @if (loadingAdditions()) {
              <p class="fl-loading">Cargando...</p>
            } @else {
              <div class="fl-options">
                @for (a of allAdditions(); track a.id) {
                  <label class="fl-option">
                    <input type="checkbox"
                           [checked]="selectedAdditionIds().has(a.id)"
                           (change)="toggleAdditionId(a.id)" />
                    <span class="fl-option-name">{{ a.name }}</span>
                    <span class="fl-option-price">{{ a.basePrice | currency:'COP':'symbol-narrow':'1.0-0' }}</span>
                  </label>
                }
              </div>
              <div class="fl-actions">
                <button class="fl-save" [disabled]="savingAdditions()" (click)="saveAdditions()">
                  {{ savingAdditions() ? 'Guardando...' : 'Guardar' }}
                </button>
                <button class="fl-cancel" (click)="editingProductAdditions.set(null)">Cancelar</button>
              </div>
            }
          </div>
        </div>
      }

      <!-- Flavor editor modal -->
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

      <!-- Create product modal -->
      @if (showCreateModal()) {
        <div class="fl-overlay" (click)="closeCreateModal()">
          <div class="create-sheet" (click)="$event.stopPropagation()">
            <div class="fl-title">Nuevo producto</div>
            <div class="create-form">
              <label class="form-field">
                <span class="form-label">Nombre *</span>
                <input type="text" [(ngModel)]="newProduct.name" placeholder="Nombre del producto" />
              </label>
              <label class="form-field">
                <span class="form-label">Descripción</span>
                <textarea [(ngModel)]="newProduct.description" placeholder="Descripción (opcional)" rows="2"></textarea>
              </label>
              <label class="form-field">
                <span class="form-label">Precio (COP) *</span>
                <input type="number" [(ngModel)]="newProduct.price" placeholder="0" min="0" />
              </label>
              <label class="form-field">
                <span class="form-label">URL de imagen</span>
                <input type="text" [(ngModel)]="newProduct.imageUrl" placeholder="https://..." />
              </label>
              <label class="form-field">
                <span class="form-label">Categoría *</span>
                @if (loadingCategories()) {
                  <p class="fl-loading">Cargando categorías...</p>
                } @else {
                  <select [(ngModel)]="newProduct.categoryId">
                    <option [value]="0" disabled>Seleccionar categoría</option>
                    @for (cat of allCategories(); track cat.id) {
                      <option [value]="cat.id">{{ cat.name }}</option>
                    }
                  </select>
                }
              </label>
              @if (createError()) {
                <p class="create-error">⚠️ {{ createError() }}</p>
              }
            </div>
            <div class="fl-actions">
              <button class="fl-save" [disabled]="creatingProduct()" (click)="submitCreateProduct()">
                {{ creatingProduct() ? 'Creando...' : 'Crear producto' }}
              </button>
              <button class="fl-cancel" (click)="closeCreateModal()">Cancelar</button>
            </div>
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

    .header-right { display: flex; flex-direction: column; align-items: flex-end; gap: 0.6em; }
    .header-stats { display: flex; gap: 0.6em; align-items: center; }
    .stat {
      font-size: 0.8em;
      font-weight: 600;
      padding: 0.3em 0.8em;
      border-radius: 20px;
    }
    .stat.active { background: rgba(63,185,80,0.15); color: #3fb950; }
    .stat.inactive { background: rgba(248,81,73,0.12); color: #f85149; }

    .create-btn {
      background: #e94560;
      color: #fff;
      border: none;
      border-radius: 8px;
      padding: 0.5em 1em;
      font-size: 0.85em;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
    }
    .create-btn:hover { background: #c73652; }

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
    .toggle-error {
      background: rgba(233,69,96,0.12); border: 1px solid #e94560;
      color: #e94560; padding: 0.7em 1em; border-radius: 8px;
      font-size: 0.85em; margin-bottom: 1em;
    }

    .action-btns {
      margin-left: auto;
      display: flex;
      align-items: center;
      gap: 0.35em;
    }

    .flavors-btn {
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

    .additions-btn {
      background: none;
      border: 1px solid #30363d;
      border-radius: 6px;
      color: #8b949e;
      font-size: 0.7em;
      padding: 0.2em 0.5em;
      cursor: pointer;
      white-space: nowrap;
    }
    .additions-btn:hover { border-color: #e94560; color: #e94560; }

    .combo-btn {
      background: none;
      border: 1px solid #30363d;
      border-radius: 6px;
      color: #8b949e;
      font-size: 0.7em;
      padding: 0.2em 0.5em;
      cursor: pointer;
    }
    .combo-btn:hover { border-color: #e3b341; color: #e3b341; }
    .combo-btn.combo-active { border-color: #e3b341; color: #e3b341; background: rgba(227,179,65,0.1); }

    .fl-option-name { flex: 1; }
    .fl-option-price { font-size: 0.8em; color: #8b949e; white-space: nowrap; }

    .combo-current { font-size: 0.82em; color: #8b949e; margin: 0 0 0.75em; }
    .combo-current strong { color: #e3b341; }
    .combo-form { display: flex; flex-direction: column; gap: 0.75em; margin-bottom: 1em; }
    .combo-field { display: flex; flex-direction: column; gap: 0.3em; }
    .combo-label { font-size: 0.78em; color: #8b949e; font-weight: 600; }
    .combo-form input {
      background: #21262d; border: 1px solid #30363d; border-radius: 8px;
      color: #e6edf3; font-size: 0.9em; padding: 0.6em 0.75em; outline: none; width: 100%;
    }
    .combo-form input:focus { border-color: #e3b341; }
    .fl-remove {
      padding: 0.75em 1em; background: rgba(248,81,73,0.1); border: 1px solid #f85149;
      border-radius: 8px; color: #f85149; font-size: 0.9em; cursor: pointer;
    }
    .fl-remove:disabled { opacity: 0.5; cursor: wait; }

    .fl-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.6);
      display: flex; align-items: flex-end; justify-content: center; z-index: 200;
    }
    .fl-sheet {
      background: #161b22; border: 1px solid #30363d; border-radius: 14px 14px 0 0;
      padding: 1.25em 1.25em 1.5em; width: 100%; max-width: 480px;
      max-height: 70vh; overflow-y: auto;
    }
    .create-sheet {
      background: #161b22; border: 1px solid #30363d; border-radius: 14px 14px 0 0;
      padding: 1.25em 1.25em 1.5em; width: 100%; max-width: 480px;
      max-height: 85vh; overflow-y: auto;
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
    .fl-actions { display: flex; gap: 0.75em; margin-top: 1em; }
    .fl-save {
      flex: 1; padding: 0.75em; background: #e94560; color: #fff;
      border: none; border-radius: 8px; font-size: 0.9em; font-weight: 600; cursor: pointer;
    }
    .fl-save:disabled { opacity: 0.5; cursor: wait; }
    .fl-cancel {
      padding: 0.75em 1em; background: none; border: 1px solid #30363d;
      border-radius: 8px; color: #8b949e; font-size: 0.9em; cursor: pointer;
    }

    /* Create form */
    .create-form { display: flex; flex-direction: column; gap: 0.85em; }
    .form-field { display: flex; flex-direction: column; gap: 0.3em; }
    .form-label { font-size: 0.8em; color: #8b949e; font-weight: 600; }
    .create-form input,
    .create-form textarea,
    .create-form select {
      background: #21262d;
      border: 1px solid #30363d;
      border-radius: 8px;
      color: #e6edf3;
      font-size: 0.9em;
      padding: 0.6em 0.75em;
      outline: none;
      width: 100%;
      transition: border-color 0.2s;
    }
    .create-form input:focus,
    .create-form textarea:focus,
    .create-form select:focus { border-color: #e94560; }
    .create-form textarea { resize: vertical; font-family: inherit; }
    .create-form select option { background: #21262d; }
    .create-error { color: #f85149; font-size: 0.82em; margin: 0; }
  `]
})
export class AdminMenuComponent implements OnInit {
  private svc = inject(AdminService);

  loading = signal(true);
  products = signal<CatalogProduct[]>([]);
  toggling = signal(new Set<number>());
  toggleError = signal('');
  search = signal('');

  editingProduct = signal<CatalogProduct | null>(null);
  allFlavors = signal<FlavorItem[]>([]);
  selectedFlavorIds = signal<Set<number>>(new Set());
  loadingFlavors = signal(false);
  savingFlavors = signal(false);

  editingProductAdditions = signal<CatalogProduct | null>(null);
  allAdditions = signal<AdditionItem[]>([]);
  selectedAdditionIds = signal<Set<number>>(new Set());
  loadingAdditions = signal(false);
  savingAdditions = signal(false);

  editingProductCombo = signal<CatalogProduct | null>(null);
  savingCombo = signal(false);
  comboForm = { description: '', price: 0 };

  showCreateModal = signal(false);
  allCategories = signal<CategoryItem[]>([]);
  loadingCategories = signal(false);
  creatingProduct = signal(false);
  createError = signal('');
  newProduct: CreateProductRequest = { name: '', description: '', price: 0, imageUrl: '', categoryId: 0 };

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
    const q = this.search().toLowerCase().trim();
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

  openComboEditor(product: CatalogProduct): void {
    this.comboForm = {
      description: product.comboDescription ?? '',
      price: product.comboPrice ?? 0
    };
    this.editingProductCombo.set(product);
  }

  saveCombo(): void {
    const product = this.editingProductCombo();
    if (!product || !this.comboForm.description.trim()) return;
    this.savingCombo.set(true);
    this.svc.setProductCombo(product.id, {
      description: this.comboForm.description.trim(),
      price: this.comboForm.price
    }).subscribe({
      next: () => {
        this.products.update(list =>
          list.map(p => p.id === product.id
            ? { ...p, comboDescription: this.comboForm.description.trim(), comboPrice: this.comboForm.price }
            : p)
        );
        this.savingCombo.set(false);
        this.editingProductCombo.set(null);
      },
      error: () => this.savingCombo.set(false)
    });
  }

  removeCombo(): void {
    const product = this.editingProductCombo();
    if (!product) return;
    this.savingCombo.set(true);
    this.svc.clearProductCombo(product.id).subscribe({
      next: () => {
        this.products.update(list =>
          list.map(p => p.id === product.id
            ? { ...p, comboDescription: undefined, comboPrice: undefined }
            : p)
        );
        this.savingCombo.set(false);
        this.editingProductCombo.set(null);
      },
      error: () => this.savingCombo.set(false)
    });
  }

  openAdditionEditor(product: CatalogProduct): void {
    this.editingProductAdditions.set(product);
    this.selectedAdditionIds.set(new Set(product.additions?.map(a => a.additionId) ?? []));
    if (this.allAdditions().length === 0) {
      this.loadingAdditions.set(true);
      this.svc.getAdditions().subscribe({
        next: additions => { this.allAdditions.set(additions); this.loadingAdditions.set(false); },
        error: () => this.loadingAdditions.set(false)
      });
    }
  }

  toggleAdditionId(id: number): void {
    this.selectedAdditionIds.update(ids => {
      const next = new Set(ids);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  saveAdditions(): void {
    const product = this.editingProductAdditions();
    if (!product) return;
    this.savingAdditions.set(true);
    this.svc.updateProductAdditions(product.id, [...this.selectedAdditionIds()]).subscribe({
      next: () => {
        const updated = this.allAdditions()
          .filter(a => this.selectedAdditionIds().has(a.id))
          .map(a => ({ id: 0, additionId: a.id, name: a.name, effectivePrice: a.basePrice }));
        this.products.update(list =>
          list.map(p => p.id === product.id ? { ...p, additions: updated } : p)
        );
        this.savingAdditions.set(false);
        this.editingProductAdditions.set(null);
      },
      error: () => this.savingAdditions.set(false)
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

  openCreateModal(): void {
    this.newProduct = { name: '', description: '', price: 0, imageUrl: '', categoryId: 0 };
    this.createError.set('');
    this.showCreateModal.set(true);
    if (this.allCategories().length === 0) {
      this.loadingCategories.set(true);
      this.svc.getCategories().subscribe({
        next: cats => { this.allCategories.set(cats); this.loadingCategories.set(false); },
        error: () => this.loadingCategories.set(false)
      });
    }
  }

  closeCreateModal(): void {
    this.showCreateModal.set(false);
    this.createError.set('');
  }

  submitCreateProduct(): void {
    if (!this.newProduct.name.trim()) {
      this.createError.set('El nombre es obligatorio.');
      return;
    }
    if (!this.newProduct.price || this.newProduct.price <= 0) {
      this.createError.set('El precio debe ser mayor a 0.');
      return;
    }
    if (!this.newProduct.categoryId) {
      this.createError.set('Selecciona una categoría.');
      return;
    }
    this.creatingProduct.set(true);
    this.createError.set('');
    this.svc.createProduct(this.newProduct).subscribe({
      next: created => {
        this.products.update(list => [...list, created]);
        this.creatingProduct.set(false);
        this.showCreateModal.set(false);
      },
      error: () => {
        this.createError.set('Error al crear el producto. Intenta de nuevo.');
        this.creatingProduct.set(false);
      }
    });
  }

  private addToggling(id: number): void {
    this.toggling.update(s => new Set([...s, id]));
  }

  private removeToggling(id: number): void {
    this.toggling.update(s => { const n = new Set(s); n.delete(id); return n; });
  }

  toggle(product: CatalogProduct): void {
    this.toggleError.set('');
    this.addToggling(product.id);
    this.svc.toggleProduct(product.id).subscribe({
      next: () => {
        this.products.update(list =>
          list.map(p => p.id === product.id ? { ...p, available: !p.available } : p)
        );
        this.removeToggling(product.id);
      },
      error: () => {
        this.removeToggling(product.id);
        this.toggleError.set('Error al actualizar el producto. Intenta de nuevo.');
      }
    });
  }
}
