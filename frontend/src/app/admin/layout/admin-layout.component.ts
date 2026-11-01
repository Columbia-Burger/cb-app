import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { Subscription } from 'rxjs';
import { AdminService } from '../services/admin.service';
import { PrintService } from '../services/print.service';
import { OrderEvent, OrderEventsService } from '../../services/order-events.service';
import { IconComponent } from '../../shared/icon.component';

interface NavItem { path: string; label: string; icon: string; }
interface NavGroup { title: string; items: NavItem[]; }

@Component({
    selector: 'app-admin-layout',
    imports: [RouterOutlet, RouterLink, RouterLinkActive, IconComponent],
    templateUrl: './admin-layout.component.html',
    styleUrl: './admin-layout.component.scss'
})
export class AdminLayoutComponent implements OnInit, OnDestroy {
  private adminService = inject(AdminService);
  private printer = inject(PrintService);
  private orderEvents = inject(OrderEventsService);
  private router = inject(Router);
  private eventSub?: Subscription;
  private printedOrderIds = new Set<number>();

  sidebarOpen = signal(false);
  readonly username = this.adminService.getCurrentUsername() ?? 'admin';

  readonly nav: NavGroup[] = [
    { title: 'Operación', items: [
      { path: '/admin/dashboard', label: 'Dashboard', icon: 'dashboard' },
      { path: '/admin/mesero', label: 'Tomar pedido', icon: 'new-order' },
      { path: '/admin/pedidos', label: 'Pedidos', icon: 'orders' },
      { path: '/admin/facturas', label: 'Facturas', icon: 'invoice' },
      { path: '/admin/turno', label: 'Turno y caja', icon: 'shift' },
    ]},
    { title: 'Catálogo', items: [
      { path: '/admin/menu', label: 'Menú', icon: 'menu' },
      { path: '/admin/adiciones', label: 'Adiciones', icon: 'additions' },
      { path: '/admin/zonas', label: 'Zonas de domicilio', icon: 'zones' },
      { path: '/admin/cupones', label: 'Cupones', icon: 'coupons' },
    ]},
    { title: 'Clientes', items: [
      { path: '/admin/clientes', label: 'Clientes', icon: 'customers' },
      { path: '/admin/social', label: 'Redes sociales', icon: 'social' },
    ]},
    { title: 'Análisis y ajustes', items: [
      { path: '/admin/reportes', label: 'Reportes', icon: 'reports' },
      { path: '/admin/usuarios', label: 'Usuarios', icon: 'users' },
    ]},
  ];

  ngOnInit(): void {
    this.eventSub = this.orderEvents.connect(this.adminService.getToken()).subscribe({
      next: event => this.printRemoteDelivery(event),
      error: error => console.error('No se pudo conectar a los eventos de pedidos.', error),
    });
  }

  ngOnDestroy(): void {
    this.eventSub?.unsubscribe();
  }

  logout(): void {
    this.adminService.logout();
    this.router.navigate(['/admin/login']);
  }

  private async printRemoteDelivery(event: OrderEvent): Promise<void> {
    const order = event.order;
    if (
      event.type !== 'ORDER_INVOICED' ||
      !event.printAtAdmin ||
      this.printedOrderIds.has(order.id) ||
      !this.printer.isRemoteAutoPrintEnabled()
    ) return;

    this.printedOrderIds.add(order.id);
    try {
      await this.printer.printTicket(order);
    } catch (error) {
      this.printedOrderIds.delete(order.id);
      console.error(`No fue posible imprimir el pedido remoto #${order.id}.`, error);
    }
  }
}
