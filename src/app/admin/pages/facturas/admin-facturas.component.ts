import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { AdminService } from '../../services/admin.service';
import { OrderResponse, InvoiceStatus } from '../../models/admin.model';
import { EditOrderModalComponent } from '../../components/edit-order-modal/edit-order-modal.component';
import { PrintService } from '../../services/print.service';

type FilterTab = 'ALL' | 'PENDING' | 'INVOICED' | 'VOID';

@Component({
  selector: 'app-admin-facturas',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, EditOrderModalComponent],
  templateUrl: './admin-facturas.component.html',
  styleUrl: './admin-facturas.component.scss',
})
export class AdminFacturasComponent implements OnInit {
  private svc = inject(AdminService);
  private printer = inject(PrintService);

  orders = signal<OrderResponse[]>([]);
  loading = signal(true);
  activeTab = signal<FilterTab>('ALL');
  generatingId = signal<number | null>(null);
  voidingId = signal<number | null>(null);
  editingOrder = signal<OrderResponse | null>(null);
  printingId = signal<number | null>(null);
  error = signal('');

  filtered = computed(() => {
    const tab = this.activeTab();
    const list = this.orders();
    if (tab === 'ALL') return list;
    return list.filter(o => o.invoiceStatus === tab);
  });

  counts = computed(() => ({
    ALL: this.orders().length,
    PENDING: this.orders().filter(o => o.invoiceStatus === 'PENDING').length,
    INVOICED: this.orders().filter(o => o.invoiceStatus === 'INVOICED').length,
    VOID: this.orders().filter(o => o.invoiceStatus === 'VOID').length,
  }));

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.svc.getInvoices().subscribe({
      next: data => { this.orders.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  generate(order: OrderResponse): void {
    this.generatingId.set(order.id);
    this.error.set('');
    this.svc.generateInvoice(order.id).subscribe({
      next: updated => {
        this.orders.update(list => list.map(o => o.id === updated.id ? updated : o));
        this.generatingId.set(null);
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Error al generar la factura');
        this.generatingId.set(null);
      },
    });
  }

  voidOrder(order: OrderResponse): void {
    if (!confirm(`¿Anular la factura ${order.invoiceNumber}?`)) return;
    this.voidingId.set(order.id);
    this.svc.voidInvoice(order.id).subscribe({
      next: updated => {
        this.orders.update(list => list.map(o => o.id === updated.id ? updated : o));
        this.voidingId.set(null);
      },
      error: () => this.voidingId.set(null),
    });
  }

  async print(order: OrderResponse): Promise<void> {
    this.printingId.set(order.id);
    try {
      await this.printer.printTicket(order);
    } finally {
      this.printingId.set(null);
    }
  }

  onOrderSaved(updated: OrderResponse): void {
    this.orders.update(list => list.map(o => o.id === updated.id ? updated : o));
    this.editingOrder.set(null);
  }

  statusLabel(s: InvoiceStatus): string {
    return s === 'INVOICED' ? 'Facturada' : s === 'VOID' ? 'Anulada' : 'Pendiente';
  }

  orderStatusLabel(s: string): string {
    const map: Record<string, string> = {
      RECEIVED: 'Recibido', PREPARING: 'Preparando',
      ON_THE_WAY: 'En camino', DELIVERED: 'Entregado', CANCELLED: 'Cancelado'
    };
    return map[s] ?? s;
  }
}
