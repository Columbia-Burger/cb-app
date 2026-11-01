import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CurrencyPipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin.service';
import { CatalogProduct, CatalogCategory, FlavorItem, AdditionItem, CategoryItem, CreateProductRequest } from '../../models/admin.model';

@Component({
    selector: 'app-admin-menu',
    imports: [CurrencyPipe, NgClass, FormsModule],
    templateUrl: './admin-menu.component.html',
    styleUrl: './admin-menu.component.scss'
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
