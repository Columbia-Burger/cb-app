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

  submit(): void {
    if (!this.useConsumidorFinal()) {
      if (!this.identification.trim() || !this.customerName.trim() || !this.customerEmail.trim()) {
        this.error.set('Completa tipo de documento, identificación, nombre o razón social y correo.');
        return;
      }
    }

    this.loading.set(true);
    this.error.set('');

    const req: ElectronicInvoiceRequest = this.useConsumidorFinal()
      ? {}
      : {
          customerDocumentType: this.documentType,
          customerIdentification: this.identification.trim(),
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
