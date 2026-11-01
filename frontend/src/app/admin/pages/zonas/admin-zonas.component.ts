import { Component, inject, signal, OnInit } from '@angular/core';
import { CurrencyPipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin.service';
import { DeliveryZone, CreateDeliveryZoneRequest } from '../../models/admin.model';

@Component({
    selector: 'app-admin-zonas',
    imports: [CurrencyPipe, NgClass, FormsModule],
    templateUrl: './admin-zonas.component.html',
    styleUrl: './admin-zonas.component.scss'
})
export class AdminZonasComponent implements OnInit {
  private svc = inject(AdminService);

  loading = signal(true);
  zones = signal<DeliveryZone[]>([]);
  toggling = signal(new Set<number>());

  showModal = signal(false);
  editingId = signal<number | null>(null);
  saving = signal(false);
  formError = signal('');
  form: CreateDeliveryZoneRequest = { name: '', deliveryFee: 0 };

  ngOnInit(): void {
    this.svc.getDeliveryZones().subscribe({
      next: data => { this.zones.set(data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  openModal(zone?: DeliveryZone): void {
    this.formError.set('');
    if (zone) {
      this.editingId.set(zone.id);
      this.form = { name: zone.name, deliveryFee: zone.deliveryFee };
    } else {
      this.editingId.set(null);
      this.form = { name: '', deliveryFee: 0 };
    }
    this.showModal.set(true);
  }

  closeModal(): void { this.showModal.set(false); }

  submit(): void {
    if (!this.form.name.trim()) { this.formError.set('El nombre es obligatorio.'); return; }
    if (this.form.deliveryFee < 0) { this.formError.set('La tarifa no puede ser negativa.'); return; }
    this.saving.set(true);
    this.formError.set('');
    const id = this.editingId();
    const op$ = id
      ? this.svc.updateDeliveryZone(id, this.form)
      : this.svc.createDeliveryZone(this.form);
    op$.subscribe({
      next: saved => {
        this.zones.update(list => id ? list.map(z => z.id === id ? saved : z) : [...list, saved]);
        this.saving.set(false);
        this.showModal.set(false);
      },
      error: () => { this.formError.set('Error al guardar. Intenta de nuevo.'); this.saving.set(false); }
    });
  }

  toggleActive(zone: DeliveryZone): void {
    this.toggling.update(s => new Set([...s, zone.id]));
    this.svc.toggleDeliveryZoneActive(zone.id).subscribe({
      next: () => {
        this.zones.update(list => list.map(z => z.id === zone.id ? { ...z, active: !z.active } : z));
        this.toggling.update(s => { const n = new Set(s); n.delete(zone.id); return n; });
      },
      error: () => {
        this.toggling.update(s => { const n = new Set(s); n.delete(zone.id); return n; });
      }
    });
  }
}
