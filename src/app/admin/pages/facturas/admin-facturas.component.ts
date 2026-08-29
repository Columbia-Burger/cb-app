import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpResponse } from '@angular/common/http';
import { AdminService } from '../../services/admin.service';
import {
  ElectronicInvoiceDetailResponse,
  ElectronicInvoiceResponse,
  InvoiceStatus,
  OrderResponse
} from '../../models/admin.model';
import { EditOrderModalComponent } from '../../components/edit-order-modal/edit-order-modal.component';
import { ElectronicInvoiceModalComponent } from '../../components/electronic-invoice-modal/electronic-invoice-modal.component';
import { PrintService } from '../../services/print.service';
import { toBogotaDateKey } from '../../../shared/business-hours';

type FilterTab = 'ALL' | 'PENDING' | 'INVOICED' | 'VOID';
type ViewMode = 'OPERATIONS' | 'ELECTRONIC';

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
  viewMode = signal<ViewMode>('OPERATIONS');
  generatingId = signal<number | null>(null);
  voidingId = signal<number | null>(null);
  confirmVoidOrder = signal<OrderResponse | null>(null);
  editingOrder = signal<OrderResponse | null>(null);
  electronicOrder = signal<OrderResponse | null>(null);
  printingId = signal<number | null>(null);
  error = signal('');

  printers = signal<string[]>([]);
  selectedPrinter = this.printer.getSavedPrinter() ?? '';
  loadingPrinters = signal(false);

  page = signal(1);
  readonly pageSize = 10;

  electronicSearch = signal('');
  electronicCustomerFilter = signal('');
  electronicDateFrom = signal('');
  electronicDateTo = signal('');
  electronicPaymentMethodFilter = signal<'ALL' | '10' | '47' | '48' | 'UNKNOWN'>('ALL');
  selectedElectronicNumber = signal<string | null>(null);
  electronicDetail = signal<ElectronicInvoiceDetailResponse | null>(null);
  loadingElectronicDetail = signal(false);
  electronicDetailError = signal('');
  downloadingPdf = signal(false);
  downloadingXml = signal(false);

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

  electronicInvoices = computed(() => {
    const term = this.electronicSearch().trim().toLowerCase();
    const customer = this.electronicCustomerFilter().trim().toLowerCase();
    const dateFrom = this.electronicDateFrom();
    const dateTo = this.electronicDateTo();
    const paymentMethod = this.electronicPaymentMethodFilter();

    return this.orders()
      .filter(o => !!o.electronicInvoiceNumber)
      .filter(o => {
        if (!term) return true;
        return [
          o.electronicInvoiceNumber,
          o.invoiceNumber,
          o.customerName,
          o.customerWhatsapp,
          o.cufe,
          String(o.id),
        ].some(value => (value ?? '').toLowerCase().includes(term));
      })
      .filter(o => {
        if (!customer) return true;
        return [o.customerName, o.customerWhatsapp].some(value => (value ?? '').toLowerCase().includes(customer));
      })
      .filter(o => {
        if (paymentMethod === 'ALL') return true;
        if (paymentMethod === 'UNKNOWN') return !o.electronicPaymentMethodCode;
        return o.electronicPaymentMethodCode === paymentMethod;
      })
      .filter(o => {
        const invoiceDate = toBogotaDateKey(this.getInvoiceDateValue(o));
        if (dateFrom && (!invoiceDate || invoiceDate < dateFrom)) return false;
        if (dateTo && (!invoiceDate || invoiceDate > dateTo)) return false;
        return true;
      });
  });

  ngOnInit(): void {
    this.load();
  }

  setTab(tab: FilterTab): void {
    this.activeTab.set(tab);
    this.page.set(1);
  }

  setViewMode(mode: ViewMode): void {
    this.viewMode.set(mode);
    this.error.set('');
  }

  load(): void {
    this.loading.set(true);
    this.page.set(1);
    this.svc.getInvoices().subscribe({
      next: data => {
        this.orders.set(data);
        this.loading.set(false);
      },
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
      error: err => {
        this.error.set(err?.error?.message ?? 'Error al generar la factura');
        this.generatingId.set(null);
      },
    });
  }

  voidOrder(order: OrderResponse): void {
    this.confirmVoidOrder.set(order);
  }

  cancelVoidOrder(): void {
    this.confirmVoidOrder.set(null);
  }

  confirmVoidInvoice(): void {
    const order = this.confirmVoidOrder();
    if (!order) return;
    this.voidingId.set(order.id);
    this.confirmVoidOrder.set(null);
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
    } catch {
      this.error.set('No se pudo conectar con QZ Tray. Asegúrate de que esté abierto.');
    } finally {
      this.loadingPrinters.set(false);
    }
  }

  savePrinter(): void {
    this.printer.savePrinter(this.selectedPrinter);
  }

  async print(order: OrderResponse): Promise<void> {
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

  openElectronicDetail(order: OrderResponse): void {
    if (!order.electronicInvoiceNumber) return;
    this.selectedElectronicNumber.set(order.electronicInvoiceNumber);
    this.loadingElectronicDetail.set(true);
    this.electronicDetailError.set('');
    this.electronicDetail.set(null);

    this.svc.getElectronicInvoiceDetail(order.electronicInvoiceNumber).subscribe({
      next: detail => {
        this.electronicDetail.set(detail);
        this.loadingElectronicDetail.set(false);
      },
      error: err => {
        this.electronicDetailError.set(err?.error?.message ?? 'No se pudo cargar el detalle de la factura.');
        this.loadingElectronicDetail.set(false);
      }
    });
  }

  closeElectronicDetail(): void {
    this.selectedElectronicNumber.set(null);
    this.electronicDetail.set(null);
    this.electronicDetailError.set('');
    this.loadingElectronicDetail.set(false);
  }

  downloadElectronicPdf(number: string): void {
    this.downloadingPdf.set(true);
    this.svc.downloadElectronicInvoicePdf(number).subscribe({
      next: response => {
        this.saveBlobResponse(response, `${number}.pdf`);
        this.downloadingPdf.set(false);
      },
      error: err => {
        this.electronicDetailError.set(err?.error?.message ?? 'No se pudo descargar el PDF.');
        this.downloadingPdf.set(false);
      }
    });
  }

  downloadElectronicXml(number: string): void {
    this.downloadingXml.set(true);
    this.svc.downloadElectronicInvoiceXml(number).subscribe({
      next: response => {
        this.saveBlobResponse(response, `${number}.xml`);
        this.downloadingXml.set(false);
      },
      error: err => {
        this.electronicDetailError.set(err?.error?.message ?? 'No se pudo descargar el XML.');
        this.downloadingXml.set(false);
      }
    });
  }

  openPublicUrl(): void {
    const url = this.electronicDetail()?.publicUrl;
    if (url) window.open(url, '_blank');
  }

  openQrUrl(): void {
    const url = this.electronicDetail()?.qrUrl;
    if (url) window.open(url, '_blank');
  }

  resendElectronicInvoiceEmail(): void {
    const detail = this.electronicDetail();
    if (!detail) return;

    const email = detail.customer.email?.trim();
    if (!email) {
      this.electronicDetailError.set('La factura no tiene correo del cliente para reenviar.');
      return;
    }

    const subject = encodeURIComponent(`Factura electronica ${detail.number}`);
    const body = encodeURIComponent(
      `Hola,\n\nCompartimos tu factura electronica ${detail.number}.\n\n` +
      `Consulta en linea: ${detail.publicUrl || 'No disponible'}\n` +
      `CUFE: ${detail.cufe}\n\nGracias.`
    );

    window.location.href = `mailto:${encodeURIComponent(email)}?subject=${subject}&body=${body}`;
  }

  statusLabel(s: InvoiceStatus): string {
    return s === 'INVOICED' ? 'Facturada' : s === 'VOID' ? 'Anulada' : 'Pendiente';
  }

  orderStatusLabel(s: string): string {
    const map: Record<string, string> = {
      RECEIVED: 'Recibido',
      PREPARING: 'Preparando',
      ON_THE_WAY: 'En camino',
      DELIVERED: 'Entregado',
      CANCELLED: 'Cancelado'
    };
    return map[s] ?? s;
  }

  detailCustomerName(): string {
    const detail = this.electronicDetail();
    if (!detail) return '';
    return detail.customer.company || detail.customer.names || 'Cliente';
  }

  paymentMethodLabel(code: string | null | undefined): string {
    return ({
      '10': 'Efectivo',
      '47': 'Transferencia Bancolombia',
      '48': 'Pago con tarjeta'
    } as Record<string, string>)[code ?? ''] ?? 'Sin dato';
  }

  invoiceDate(order: OrderResponse): string | null {
    return this.getInvoiceDateValue(order);
  }

  private getInvoiceDateValue(order: OrderResponse): string | null {
    return order.invoicedAt || order.createdAt || null;
  }

  private saveBlobResponse(response: HttpResponse<Blob>, fallbackName: string): void {
    if (!response.body) return;

    const contentDisposition = response.headers.get('content-disposition') ?? '';
    const match = /filename="?(.*?)"?$/i.exec(contentDisposition);
    const fileName = match?.[1] ?? fallbackName;

    const url = window.URL.createObjectURL(response.body);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    window.URL.revokeObjectURL(url);
  }
}
