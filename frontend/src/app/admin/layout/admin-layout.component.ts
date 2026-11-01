import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { Subscription } from 'rxjs';
import { AdminService } from '../services/admin.service';
import { PrintService } from '../services/print.service';
import { OrderEvent, OrderEventsService } from '../../services/order-events.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
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
