import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ElectronicInvoiceRequest, ElectronicInvoiceResponse, OrderResponse } from '../../models/admin.model';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-electronic-invoice-modal',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './electronic-invoice-modal.component.html',
  styleUrl: './electronic-invoice-modal.component.scss',
})
export class ElectronicInvoiceModalComponent {
  @Input() order!: OrderResponse;
  @Output() done = new EventEmitter<ElectronicInvoiceResponse>();
  @Output() cancelled = new EventEmitter<void>();

  private adminService = inject(AdminService);

  useConsumidorFinal = signal(true);
  documentType: 'CC' | 'NIT' = 'CC';
  paymentMethodCode: '10' | '47' | '48' = '10';
  identification = '';
  customerName = '';
  customerEmail = '';
  loading = signal(false);
  error = signal('');

  get identificationLabel(): string {
    return this.documentType === 'NIT' ? 'NIT' : 'Cédula';
  }

  get customerNameLabel(): string {
    return this.documentType === 'NIT' ? 'Razón social' : 'Nombre completo';
  }

  readonly paymentMethods = [
    { code: '10', icon: '💵', label: 'Efectivo' },
    { code: '47', icon: '🏦', label: 'Transferencia' },
    { code: '48', icon: '💳', label: 'Tarjeta' },
  ] as const;

  readonly documentTypes = [
    { code: 'CC', icon: '🪪', label: 'Cédula' },
    { code: 'NIT', icon: '🏢', label: 'NIT (empresa)' },
  ] as const;

  /** NIT sin puntos, espacios ni dígito de verificación ("900.123.456-7" → "900123456"). */
  get nitBase(): string {
    return this.identification.split('-')[0].replace(/\D/g, '');
  }

  /** DV escrito por el usuario después del guion, si lo puso. */
  get typedDv(): string | null {
    const parts = this.identification.split('-');
    const dv = parts.length > 1 ? parts[1].replace(/\D/g, '') : '';
    return dv || null;
  }

  /** Dígito de verificación según el algoritmo de la DIAN (módulo 11). */
  get computedDv(): string | null {
    const nit = this.nitBase;
    if (nit.length < 6) return null;
    const weights = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];
    let sum = 0;
    for (let i = 0; i < nit.length && i < weights.length; i++) {
      sum += Number(nit[nit.length - 1 - i]) * weights[i];
    }
    const r = sum % 11;
    return String(r > 1 ? 11 - r : r);
  }

  get dvMismatch(): boolean {
    return this.documentType === 'NIT' && this.typedDv !== null && this.computedDv !== null
      && this.typedDv !== this.computedDv;
  }

  submit(): void {
    if (!this.useConsumidorFinal()) {
      if (!this.identification.trim() || !this.customerName.trim() || !this.customerEmail.trim()) {
        this.error.set('Completa tipo de documento, identificación, nombre o razón social y correo.');
        return;
      }
      if (this.dvMismatch) {
        this.error.set(`El dígito de verificación no coincide: para ese NIT debería ser ${this.computedDv}. Revisa el número.`);
        return;
      }
    }

    this.loading.set(true);
    this.error.set('');

    const req: ElectronicInvoiceRequest = this.useConsumidorFinal()
      ? { paymentMethodCode: this.paymentMethodCode }
      : {
          customerDocumentType: this.documentType,
          paymentMethodCode: this.paymentMethodCode,
          // Factus pide el NIT sin DV ni guion y calcula el DV por su cuenta
          customerIdentification: this.documentType === 'NIT' ? this.nitBase : this.identification.replace(/\D/g, ''),
          customerName: this.customerName.trim(),
          customerEmail: this.customerEmail.trim(),
        };

    this.adminService.generateElectronicInvoice(this.order.id, req).subscribe({
      next: res => { this.loading.set(false); this.done.emit(res); },
      error: err => {
        this.error.set(err?.error?.message ?? 'Error al generar la factura electrónica');
        this.loading.set(false);
      },
    });
  }
}
