import { Component, inject, signal, computed, OnInit, ViewChild } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin.service';
import { PrintService } from '../../services/print.service';
import { CatalogProduct } from '../../models/admin.model';
import { OrderBuilderComponent, TABLES } from '../../../shared/order-builder/order-builder.component';

interface ZoneOption { name: string; price: number; }
const PICKUP_OPTION: ZoneOption = { name: 'Recoger aquí', price: 0 };

@Component({
  selector: 'app-admin-mesero',
  imports: [CurrencyPipe, FormsModule, OrderBuilderComponent],
  templateUrl: './admin-mesero.component.html',
  styleUrl: './admin-mesero.component.scss',
})
export class AdminMeseroComponent implements OnInit {
  private adminService = inject(AdminService);
  private printer = inject(PrintService);

  @ViewChild(OrderBuilderComponent) builder?: OrderBuilderComponent;

  readonly tables = TABLES;
  loading = signal(true);
  products = signal<CatalogProduct[]>([]);
  submitting = signal(false);
  successMsg = signal('');
  errorMsg = signal('');

  orderType = signal<'mesa' | 'llevar' | ''>('');
  tableNumber = signal('');
  selectedZoneName = signal('');
  deliveryZones = signal<ZoneOption[]>([PICKUP_OPTION]);

  selectedZone = computed(() => this.deliveryZones().find(z => z.name === this.selectedZoneName()) ?? null);
  deliveryFee = computed(() => (this.orderType() === 'llevar' ? this.selectedZone()?.price ?? 0 : 0));

  canSubmit = computed(() => {
    const type = this.orderType();
    return !this.submitting()
      && (type === 'mesa' ? !!this.tableNumber() : type === 'llevar' ? !!this.selectedZoneName() : false);
  });

  ngOnInit(): void {
    this.adminService.getMenu().subscribe({
      next: products => { this.products.set(products); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
    this.adminService.getDeliveryZones(true).subscribe({
      next: zones => this.deliveryZones.set([PICKUP_OPTION, ...zones.map(z => ({ name: z.name, price: z.deliveryFee }))]),
    });
  }

  submitOrder(): void {
    const builder = this.builder;
    const type = this.orderType();
    if (!builder || !this.canSubmit() || builder.itemCount() === 0) return;

    this.submitting.set(true);
    this.successMsg.set('');
    this.errorMsg.set('');
    const zone = this.selectedZone();
    const notes = type === 'mesa' ? this.tableNumber() : 'Para llevar';

    this.adminService.createOrder({
      customerName: 'Mesero',
      customerWhatsapp: 'ADMIN-WAITER',
      items: builder.buildItems(),
      notes,
      deliveryZone: type === 'llevar' ? zone?.name : undefined,
      deliveryFee: type === 'llevar' ? (zone?.price ?? 0) : undefined,
      source: 'WAITER',
    }).subscribe({
      next: async order => {
        try {
          await this.printer.printTicket(order);
        } catch (error) {
          console.error('No fue posible imprimir la factura del pedido.', error);
        }
        this.successMsg.set(`Pedido #${order.id} — ${notes}`);
        builder.clear();
        this.orderType.set('');
        this.tableNumber.set('');
        this.selectedZoneName.set('');
        this.submitting.set(false);
      },
      error: () => {
        this.errorMsg.set('Error al crear el pedido. Intenta de nuevo.');
        this.submitting.set(false);
      },
    });
  }
}
