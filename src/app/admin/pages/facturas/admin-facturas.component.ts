import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin.service';
import { OrderResponse, InvoiceStatus, ElectronicInvoiceResponse } from '../../models/admin.model';
import { EditOrderModalComponent } from '../../components/edit-order-modal/edit-order-modal.component';
import { ElectronicInvoiceModalComponent } from '../../components/electronic-invoice-modal/electronic-invoice-modal.component';
import { PrintService } from '../../services/print.service';

type FilterTab = 'ALL' | 'PENDING' | 'INVOICED' | 'VOID';

@Component({
  selector: 'app-admin-facturas',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, EditOrderModalComponent, ElectronicInvoiceModalComponent, FormsModule],
  templateUrl: './admin-facturas.component.html',
  styleUrl: './admin-facturas.component.scss',
})
export class AdminFacturasComponent implements OnInit {
  private svc = inject(AdminService);
  protected printer = inject(PrintService);

  orders = signal<OrderResponse[]>([]);
  loading = signal(true);
  activeTab = signal<FilterTab>('ALL');
  generatingId = signal<number | null>(null);
  voidingId = signal<number | null>(null);
  editingOrder = signal<OrderResponse | null>(null);
  electronicOrder = signal<OrderResponse | null>(null);
  printingId = signal<number | null>(null);
  error = signal('');

  printers = signal<string[]>([]);
  selectedPrinter = this.printer.getSavedPrinter() ?? '';
  loadingPrinters = signal(false);

  page = signal(1);
  readonly pageSize = 10;

  filteredAll = computed(() => {
    const tab = this.activeTab();
    const list = this.orders();
    if (tab === 'ALL') return list;
    return list.filter(o => o.invoiceStatus === tab);
  });

  filtered = computed(() => {
    const all = this.filteredAll();
    const start = (this.page() - 1) * this.pageSize;
    return all.slice(start, start + this.pageSize);
  });

  totalPages = computed(() => Math.max(1, Math.ceil(this.filteredAll().length / this.pageSize)));

  counts = computed(() => ({
    ALL: this.orders().length,
    PENDING: this.orders().filter(o => o.invoiceStatus === 'PENDING').length,
    INVOICED: this.orders().filter(o => o.invoiceStatus === 'INVOICED').length,
    VOID: this.orders().filter(o => o.invoiceStatus === 'VOID').length,
  }));

  ngOnInit(): void {
    this.load();
  }

  setTab(tab: FilterTab): void {
    this.activeTab.set(tab);
    this.page.set(1);
  }

  load(): void {
    this.loading.set(true);
    this.page.set(1);
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

  async loadPrinters(): Promise<void> {
    this.loadingPrinters.set(true);
    try {
      const list = await this.printer.listPrinters();
      this.printers.set(list);
      if (!this.selectedPrinter && list.length > 0) {
        this.selectedPrinter = list[0];
      }
    } catch (e) {
      this.error.set('No se pudo conectar con QZ Tray. Asegúrate de que esté abierto.');
    } finally {
      this.loadingPrinters.set(false);
    }
  }

  savePrinter(): void {
    this.printer.savePrinter(this.selectedPrinter);
  }

  async print(order: OrderResponse): Promise<void> {
    if (!this.printer.getSavedPrinter() && !this.selectedPrinter) {
      this.error.set('Selecciona una impresora primero.');
      return;
    }
    if (this.selectedPrinter) this.printer.savePrinter(this.selectedPrinter);
    this.printingId.set(order.id);
    this.error.set('');
    try {
      await this.printer.printTicket(order);
    } catch (e: any) {
      this.error.set(e?.message ?? 'Error al imprimir');
    } finally {
      this.printingId.set(null);
    }
  }

  onElectronicDone(res: ElectronicInvoiceResponse, order: OrderResponse): void {
    this.orders.update(list => list.map(o =>
      o.id === order.id
        ? { ...o, electronicInvoiceNumber: res.number, cufe: res.cufe, invoiceStatus: 'INVOICED' }
        : o
    ));
    this.electronicOrder.set(null);
    if (res.pdfUrl) window.open(res.pdfUrl, '_blank');
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
