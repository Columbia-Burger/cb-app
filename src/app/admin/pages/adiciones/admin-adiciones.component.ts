import { Component, inject, signal, OnInit } from '@angular/core';
import { CurrencyPipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin.service';
import { AdditionItem, CreateAdditionRequest } from '../../models/admin.model';

@Component({
  selector: 'app-admin-adiciones',
  standalone: true,
  imports: [CurrencyPipe, NgClass, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h2 class="page-title">Adiciones</h2>
          <p class="page-sub">Extras que se pueden agregar a los productos al tomar un pedido</p>
        </div>
        <button class="create-btn" (click)="openModal()">+ Nueva adición</button>
      </div>

      @if (loading()) {
        <div class="loading"><div class="spinner"></div> Cargando...</div>
      } @else if (additions().length === 0) {
        <p class="empty">No hay adiciones registradas.</p>
      } @else {
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Descripción</th>
                <th>Precio base</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (a of additions(); track a.id) {
                <tr [class.inactive-row]="a.active === false">
                  <td class="name-cell">{{ a.name }}</td>
                  <td class="desc-cell">{{ a.description ?? '—' }}</td>
                  <td class="price-cell">{{ a.basePrice | currency:'COP':'symbol-narrow':'1.0-0' }}</td>
                  <td>
                    <span class="badge" [ngClass]="a.active === false ? 'badge-off' : 'badge-on'">
                      {{ a.active === false ? 'Inactiva' : 'Activa' }}
                    </span>
                  </td>
                  <td class="actions-cell">
                    <button class="action-btn" (click)="openModal(a)">✏️</button>
                    <button class="action-btn toggle-action"
                            [class.deactivate]="a.active !== false"
                            (click)="toggleActive(a)"
                            [disabled]="toggling().has(a.id)">
                      {{ a.active === false ? 'Activar' : 'Desactivar' }}
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      @if (showModal()) {
        <div class="overlay" (click)="closeModal()">
          <div class="sheet" (click)="$event.stopPropagation()">
            <div class="sheet-title">{{ editingId() ? 'Editar adición' : 'Nueva adición' }}</div>
            <div class="form">
              <label class="field">
                <span class="label">Nombre *</span>
                <input type="text" [(ngModel)]="form.name" placeholder="Ej: Queso extra" />
              </label>
              <label class="field">
                <span class="label">Descripción</span>
                <input type="text" [(ngModel)]="form.description" placeholder="Opcional" />
              </label>
              <label class="field">
                <span class="label">Precio base (COP) *</span>
                <input type="number" [(ngModel)]="form.basePrice" placeholder="0" min="0" />
              </label>
              @if (formError()) {
                <p class="form-error">⚠️ {{ formError() }}</p>
              }
            </div>
            <div class="sheet-actions">
              <button class="btn-save" [disabled]="saving()" (click)="submit()">
                {{ saving() ? 'Guardando...' : (editingId() ? 'Guardar cambios' : 'Crear') }}
              </button>
              <button class="btn-cancel" (click)="closeModal()">Cancelar</button>
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
      display: flex; align-items: flex-start; justify-content: space-between;
      gap: 1em; margin-bottom: 1.5em; flex-wrap: wrap;
    }
    .page-title { font-size: 1.5em; font-weight: 700; color: #e6edf3; margin: 0 0 0.2em; }
    .page-sub { color: #8b949e; font-size: 0.85em; margin: 0; }
    .create-btn {
      background: #e94560; color: #fff; border: none; border-radius: 8px;
      padding: 0.5em 1em; font-size: 0.85em; font-weight: 600; cursor: pointer;
      white-space: nowrap;
    }
    .create-btn:hover { background: #c73652; }

    .loading { display: flex; align-items: center; gap: 0.75em; color: #8b949e; padding: 3em 0; }
    .spinner {
      width: 20px; height: 20px; border: 2px solid #30363d;
      border-top-color: #e94560; border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .empty { color: #8b949e; text-align: center; padding: 3em; }

    .table-wrap { overflow-x: auto; background: #0d1117; border-radius: 10px; border: 1px solid #21262d; }
    .table {
      width: 100%; border-collapse: collapse; font-size: 0.88em;
    }
    .table thead, .table tbody, .table tr { background: transparent; }
    .table th {
      text-align: left; padding: 0.6em 0.85em;
      color: #8b949e; font-weight: 600; font-size: 0.8em; text-transform: uppercase;
      border-bottom: 1px solid #21262d; white-space: nowrap; background: #0d1117;
    }
    .table td {
      padding: 0.75em 0.85em; border-bottom: 1px solid #21262d; vertical-align: middle; background: #0d1117;
    }
    .table tr:last-child td { border-bottom: none; }
    .inactive-row td { opacity: 0.5; }
    .name-cell { font-weight: 600; color: #e6edf3; }
    .desc-cell { color: #8b949e; font-size: 0.85em; }
    .price-cell { color: #3fb950; font-weight: 600; white-space: nowrap; }

    .badge {
      display: inline-block; font-size: 0.75em; font-weight: 700;
      padding: 0.2em 0.7em; border-radius: 20px; white-space: nowrap;
    }
    .badge-on { background: rgba(63,185,80,0.15); color: #3fb950; }
    .badge-off { background: rgba(248,81,73,0.12); color: #f85149; }

    .actions-cell { display: flex; align-items: center; gap: 0.5em; white-space: nowrap; }
    .action-btn {
      background: none; border: 1px solid #30363d; border-radius: 6px;
      color: #8b949e; font-size: 0.78em; padding: 0.3em 0.6em; cursor: pointer;
    }
    .action-btn:hover { border-color: #e94560; color: #e94560; }
    .toggle-action { font-size: 0.75em; }
    .toggle-action.deactivate:hover { border-color: #f85149; color: #f85149; }
    .action-btn:disabled { opacity: 0.4; cursor: wait; }

    .overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.6);
      display: flex; align-items: flex-end; justify-content: center; z-index: 200;
    }
    .sheet {
      background: #161b22; border: 1px solid #30363d; border-radius: 14px 14px 0 0;
      padding: 1.25em 1.25em 1.5em; width: 100%; max-width: 480px; max-height: 80vh; overflow-y: auto;
    }
    .sheet-title { font-size: 1em; font-weight: 700; color: #e6edf3; margin-bottom: 1em; }
    .form { display: flex; flex-direction: column; gap: 0.85em; margin-bottom: 1em; }
    .field { display: flex; flex-direction: column; gap: 0.3em; }
    .label { font-size: 0.8em; color: #8b949e; font-weight: 600; }
    .form input {
      background: #21262d; border: 1px solid #30363d; border-radius: 8px;
      color: #e6edf3; font-size: 0.9em; padding: 0.6em 0.75em; outline: none; width: 100%;
    }
    .form input:focus { border-color: #e94560; }
    .form-error { color: #f85149; font-size: 0.82em; margin: 0; }
    .sheet-actions { display: flex; gap: 0.75em; }
    .btn-save {
      flex: 1; padding: 0.75em; background: #e94560; color: #fff;
      border: none; border-radius: 8px; font-size: 0.9em; font-weight: 600; cursor: pointer;
    }
    .btn-save:disabled { opacity: 0.5; cursor: wait; }
    .btn-cancel {
      padding: 0.75em 1em; background: none; border: 1px solid #30363d;
      border-radius: 8px; color: #8b949e; font-size: 0.9em; cursor: pointer;
    }
  `]
})
export class AdminAdicionesComponent implements OnInit {
  private svc = inject(AdminService);

  loading = signal(true);
  additions = signal<AdditionItem[]>([]);
  toggling = signal(new Set<number>());

  showModal = signal(false);
  editingId = signal<number | null>(null);
  saving = signal(false);
  formError = signal('');
  form: CreateAdditionRequest = { name: '', description: '', basePrice: 0 };

  ngOnInit(): void {
    this.svc.getAdditions().subscribe({
      next: data => { this.additions.set(data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  openModal(addition?: AdditionItem): void {
    this.formError.set('');
    if (addition) {
      this.editingId.set(addition.id);
      this.form = { name: addition.name, description: addition.description ?? '', basePrice: addition.basePrice };
    } else {
      this.editingId.set(null);
      this.form = { name: '', description: '', basePrice: 0 };
    }
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  submit(): void {
    if (!this.form.name.trim()) { this.formError.set('El nombre es obligatorio.'); return; }
    if (!this.form.basePrice || this.form.basePrice < 0) { this.formError.set('El precio debe ser mayor o igual a 0.'); return; }
    this.saving.set(true);
    this.formError.set('');
    const id = this.editingId();
    const req = { ...this.form, description: this.form.description || undefined };
    const op$ = id
      ? this.svc.updateAddition(id, req)
      : this.svc.createAddition(req);
    op$.subscribe({
      next: saved => {
        this.additions.update(list =>
          id ? list.map(a => a.id === id ? saved : a) : [...list, saved]
        );
        this.saving.set(false);
        this.showModal.set(false);
      },
      error: () => {
        this.formError.set('Error al guardar. Intenta de nuevo.');
        this.saving.set(false);
      }
    });
  }

  toggleActive(addition: AdditionItem): void {
    this.toggling.update(s => new Set([...s, addition.id]));
    this.svc.toggleAdditionActive(addition.id).subscribe({
      next: () => {
        this.additions.update(list =>
          list.map(a => a.id === addition.id ? { ...a, active: !a.active } : a)
        );
        this.toggling.update(s => { const n = new Set(s); n.delete(addition.id); return n; });
      },
      error: () => {
        this.toggling.update(s => { const n = new Set(s); n.delete(addition.id); return n; });
      }
    });
  }
}
