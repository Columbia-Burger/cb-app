import { Injectable } from '@angular/core';
import { OrderResponse } from '../models/admin.model';

// QZ Tray is loaded via CDN script tag in index.html
declare const qz: any;

const COLS = 32; // 57mm paper ≈ 32 chars at standard font

const PRINTER_KEY = 'cb_printer_name';

@Injectable({ providedIn: 'root' })
export class PrintService {

  private connected = false;

  async listPrinters(): Promise<string[]> {
    await this.ensureConnected();
    const result = await qz.printers.find();
    return Array.isArray(result) ? result : [result];
  }

  getSavedPrinter(): string | null {
    return localStorage.getItem(PRINTER_KEY);
  }

  savePrinter(name: string): void {
    localStorage.setItem(PRINTER_KEY, name);
  }

  async printTicket(order: OrderResponse): Promise<void> {
    await this.ensureConnected();
    const printer = await this.resolvePrinter();
    const config = qz.configs.create(printer);
    const data = this.buildEscPos(order);
    await qz.print(config, data);
  }

  private async resolvePrinter(): Promise<string> {
    const saved = this.getSavedPrinter();
    if (saved) return saved;
    const defaultPrinter: string = await qz.printers.getDefault();
    return defaultPrinter;
  }

  private async ensureConnected(): Promise<void> {
    if (this.connected && qz.websocket.isActive()) return;
    await qz.websocket.connect();
    this.connected = true;
  }

  private buildEscPos(order: OrderResponse): object[] {
    const lines: object[] = [];

    const esc = (hex: string) => ({ type: 'raw', format: 'hex', data: hex });
    const text = (t: string) => ({ type: 'raw', format: 'plain', data: t + '\n' });
    const cut = () => esc('1b 69');           // full cut
    const boldOn = () => esc('1b 45 01');
    const boldOff = () => esc('1b 45 00');
    const centerOn = () => esc('1b 61 01');
    const centerOff = () => esc('1b 61 00');
    const dbl = () => esc('1b 21 30');        // double width+height
    const normal = () => esc('1b 21 00');
    const line = () => text('—'.repeat(COLS));

    const pad = (left: string, right: string): string => {
      const gap = COLS - left.length - right.length;
      return left + ' '.repeat(Math.max(1, gap)) + right;
    };

    const formatCOP = (v: number) =>
      '$' + Math.round(v).toLocaleString('es-CO');

    const now = new Date();
    const dateStr = now.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: '2-digit' });
    const timeStr = now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

    // Header
    lines.push(centerOn(), dbl());
    lines.push(text('COLUMBIA BURGER'));
    lines.push(normal(), centerOff());

    if (order.invoiceNumber) {
      lines.push(centerOn(), boldOn());
      lines.push(text(order.invoiceNumber));
      lines.push(boldOff(), centerOff());
    }

    lines.push(text(pad(`Pedido #${order.id}`, `${dateStr} ${timeStr}`)));
    lines.push(line());

    // Cliente
    lines.push(boldOn());
    lines.push(text('Cliente:'));
    lines.push(boldOff());
    lines.push(text(order.customerName));
    if (order.deliveryZone) lines.push(text(`Zona: ${order.deliveryZone}`));
    if (order.notes) lines.push(text(`Nota: ${order.notes}`));
    lines.push(line());

    // Items
    lines.push(boldOn());
    lines.push(text(pad('PRODUCTO', 'SUBTOTAL')));
    lines.push(boldOff());
    lines.push(line());

    for (const item of order.items) {
      const subtotal = formatCOP(item.unitPrice * item.quantity);
      lines.push(text(pad(`${item.quantity}x ${item.productName}`, subtotal)));
      if (item.flavor) lines.push(text(`   · ${item.flavor}`));
      if (item.additions) lines.push(text(`   + ${item.additions}`));
      if (item.note) lines.push(text(`   * ${item.note}`));
    }

    lines.push(line());

    // Totales
    if (order.deliveryFee && order.deliveryFee > 0) {
      lines.push(text(pad('Subtotal:', formatCOP(order.total - order.deliveryFee))));
      lines.push(text(pad('Domicilio:', formatCOP(order.deliveryFee))));
    }

    lines.push(boldOn(), dbl());
    lines.push(text(pad('TOTAL', formatCOP(order.total))));
    lines.push(normal(), boldOff());
    lines.push(line());

    // Footer
    lines.push(centerOn());
    lines.push(text('Gracias por tu pedido!'));
    lines.push(text(''));
    lines.push(text(''));
    lines.push(centerOff());
    lines.push(cut());

    return lines;
  }
}
