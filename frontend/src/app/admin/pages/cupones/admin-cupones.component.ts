import { Component, inject, signal, OnInit } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { AdminService } from '../../services/admin.service';

export interface Coupon {
  id: number;
  code: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  active: boolean;
  expiresAt?: string;
  maxUses?: number;
  currentUses: number;
  createdAt: string;
}

@Component({
  selector: 'app-admin-cupones',
  standalone: true,
  imports: [DatePipe, DecimalPipe],
  templateUrl: './admin-cupones.component.html',
  styleUrl: './admin-cupones.component.scss',
})
export class AdminCuponesComponent implements OnInit {
  private svc = inject(AdminService);

  coupons = signal<Coupon[]>([]);
  loading = signal(false);
  saving = signal(false);
  error = signal('');

  showForm = signal(false);
  code = signal('');
  type = signal<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  value = signal('');
  maxUses = signal('');
  expiresAt = signal('');

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.svc.getCoupons().subscribe({
      next: data => { this.coupons.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  create(): void {
    if (!this.code().trim() || !this.value()) return;
    this.saving.set(true);
    this.error.set('');
    this.svc.createCoupon({
      code: this.code().trim().toUpperCase(),
      type: this.type(),
      value: parseFloat(this.value()),
      maxUses: this.maxUses() ? parseInt(this.maxUses()) : null,
      expiresAt: this.expiresAt() || null,
    }).subscribe({
      next: c => {
        this.coupons.update(list => [c, ...list]);
        this.saving.set(false);
        this.resetForm();
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Error al crear el cupón');
        this.saving.set(false);
      },
    });
  }

  toggle(coupon: Coupon): void {
    this.svc.toggleCoupon(coupon.id).subscribe({
      next: updated => this.coupons.update(list => list.map(c => c.id === updated.id ? updated : c)),
    });
  }

  delete(coupon: Coupon): void {
    if (!confirm(`¿Eliminar cupón "${coupon.code}"?`)) return;
    this.svc.deleteCoupon(coupon.id).subscribe({
      next: () => this.coupons.update(list => list.filter(c => c.id !== coupon.id)),
    });
  }

  resetForm(): void {
    this.showForm.set(false);
    this.code.set('');
    this.type.set('PERCENTAGE');
    this.value.set('');
    this.maxUses.set('');
    this.expiresAt.set('');
  }

  typeLabel(type: string): string {
    return type === 'PERCENTAGE' ? '%' : '$';
  }
}
