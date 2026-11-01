import { Component, inject, signal, OnInit } from '@angular/core';
import { CurrencyPipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin.service';
import { AdditionItem, CreateAdditionRequest } from '../../models/admin.model';

@Component({
    selector: 'app-admin-adiciones',
    imports: [CurrencyPipe, NgClass, FormsModule],
    templateUrl: './admin-adiciones.component.html',
    styleUrl: './admin-adiciones.component.scss'
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
