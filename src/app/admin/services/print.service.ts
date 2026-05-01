import { Injectable } from '@angular/core';
import { OrderResponse } from '../models/admin.model';

declare const qz: any;

const COLS = 32;
const PRINTER_KEY = 'cb_printer_name';

const CERTIFICATE = `-----BEGIN CERTIFICATE-----
MIIDITCCAgmgAwIBAgIUVa2V8sU1A0PmlqNi3oYvArpGr9EwDQYJKoZIhvcNAQEL
BQAwIDEeMBwGA1UEAwwVQ29sdW1iaWEgQnVyZ2VyIEFkbWluMB4XDTI2MDUwMTAx
MzgyOFoXDTM2MDQyODAxMzgyOFowIDEeMBwGA1UEAwwVQ29sdW1iaWEgQnVyZ2Vy
IEFkbWluMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAmy297CvjvqDD
zRqMyRivDfAck56nzhLjNeJ8lvtOECKd/mKOTX1/+YPaPN2xDKFQLIzdFNygOYKa
XRd2AKdtNcCWguu0uzIPrAH8l6eWYTydnmTXoU8MHXY6uHrhIGmjlGAXG5tUM3mf
WFuDCvcXOSV5V8dcOKUigS6InTdwk6fSyaygR5/1xTnthudUwN3QauaYLLPJBcQF
GacorWkQKhemhGXk6CPtFFfKTxfgtt/ZivdI8Xq9VCngcDE/H6gijjBZbi8QJCMT
x11snp6WrzzII4QYbRh/2mE8DoZYSIlioBhdxxs06NGh/FYcCwYPa+6jyIT0uN4l
6zb6uFnetQIDAQABo1MwUTAdBgNVHQ4EFgQUjVQaGME2iHuYyHd0FtwS4ZomhKsw
HwYDVR0jBBgwFoAUjVQaGME2iHuYyHd0FtwS4ZomhKswDwYDVR0TAQH/BAUwAwEB
/zANBgkqhkiG9w0BAQsFAAOCAQEAcq5RD9Z0h69Hp3ePofog2YTga8k4ULGJFajY
qcPNzkprmFZ5I3+2R6rkTtO4PI5P9fu5u9RJKOdG7rDu3TY/89W9d+EA0oxE8boG
/bIomnwhH9FRt/8Mwkp1eM7Hssu36IZCBpma3XrLiCGTYf5F16NAUc7I1JjM2jJL
5SeJnBGbCExlEmz8XQtMAQjQHqwENKnaecc+CDTGfy1D4saI2aFLSLxktPZn8r3m
SeYVH4VALgE6e0hV1mXlUxz/yZKBpER7aLKbogHbvAMYB2mLVPgBdGZxx+0lmgVp
idf8W8GiRrfjnfjUSAePBV2I1DCioc7Sxee8q46gcAZwVnSmww==
-----END CERTIFICATE-----`;

const PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCbLb3sK+O+oMPN
GozJGK8N8ByTnqfOEuM14nyW+04QIp3+Yo5NfX/5g9o83bEMoVAsjN0U3KA5gppd
F3YAp201wJaC67S7Mg+sAfyXp5ZhPJ2eZNehTwwddjq4euEgaaOUYBcbm1QzeZ9Y
W4MK9xc5JXlXx1w4pSKBLoidN3CTp9LJrKBHn/XFOe2G51TA3dBq5pgss8kFxAUZ
pyitaRAqF6aEZeToI+0UV8pPF+C239mK90jxer1UKeBwMT8fqCKOMFluLxAkIxPH
XWyenpavPMgjhBhtGH/aYTwOhlhIiWKgGF3HGzTo0aH8VhwLBg9r7qPIhPS43iXr
Nvq4Wd61AgMBAAECggEACzDz55aCZNMBI/zZm+l65c6ur5UWMDC2WwJpRACTkJV/
3vglH/YLLB0ZTgvv8u5RqFDauIsxG/dXt3B+dbgdZ8O//Gj607LzJI96c8Z7PCqB
XzURxFlS0UTKTIKCKL1YSyut5vNfZxygRGCfKq6HadCSd8/nI6esfXQJbWCG7thj
bYfypjhSDYcZk+7OAjJQ5f6ebhjNQUkqrQTQSy25Ff6pY59VqT33YApXSBJcbx/N
sl4BH3nV5iFHZRINNASfahXcsvyxPcbdgeQjIzsoIBILqDKqqk97ghF3n3yosLm4
mpY4D/fC5MaDwkvrR1QFohLRoAsmqw+80Gwn8lja+QKBgQDNGeITFzhvxuD9sEjM
9sNiQ/Q997ir6NjLmZQE8vMjl7Qc7SXpR8zbQgIoanBnlw3W+/pDZLh9mKPF5pxX
Df7Q/NJB5aZ+fRaqp+IXLxJXtIxB8+EUiyHgnAUPgV9U5AiEoc+E2dOYqh5Pa0Sx
TkEbOsgE4N5akTIDAJCIER7G3QKBgQDBsEbBzxsEGWl0oLggPM3levw0iJHoqg0O
cG0yYUr2Z37v4IVv3KT6SYKKCMhb9BV4s+rGCPVSsjh7NavpR4XmNW6tfAusWjUB
Iy8kV/BpUqtNmC17oXbp+kg9j62lPWbrIR3rSrHKyZ3+ZJ37KQ/0XzOb9wXXjS9J
cNw9TUe9uQKBgG6bicb/28iz+Tv2qJwYa6//s6UDhgz3iorqLOAqYSMNue1rmule
dkS8KUvAcxP6a1VIGGPl2nSpL5EXV7K+8m+kGIO/JHXMYb/wv8X+9aZk0Mr0iaq5
ibCGk1gUTeQLAej9Fluv2SPYgnYUBDyWVhgoMBwpZOB0swLZeBhZGz7lAoGAapGt
7NciGzhMMLJ5fKtX8kqf19vIxEZEVsx/GHg1wauiSSO05550W430uDQq4YVEBxyf
MYUeTfjnYMtgIkOLJeYCVovo9FTR0yVju9By49Brlo8Df4GQpx5hfxW9yiwlo3ue
NabsehJCzwTXc6jdMWzsPYVF/pqdCQCC/Wu27GkCgYEAwRfhLESB3EIkPDDCfLew
4e09u7XYgK5m60Q3enky7Go0rFrutIQtoKCslQR0T0l8S1J/12Kp5BQpzj8RTXti
DBtHJBV6w1OPjtocXzrbiFowUFNkRT77We91Sqeq0xbYEHf4m+ED1Dz4dUFjBDiA
YtrJ4w9moKmJueFYAztff5A=
-----END PRIVATE KEY-----`;

@Injectable({ providedIn: 'root' })
export class PrintService {

  private connected = false;
  private cryptoKey: CryptoKey | null = null;

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
    return qz.printers.getDefault();
  }

  private async ensureConnected(): Promise<void> {
    if (this.connected && qz.websocket.isActive()) return;
    this.setupSecurity();
    await qz.websocket.connect();
    this.connected = true;
  }

  private setupSecurity(): void {
    qz.security.setCertificatePromise((resolve: (v: string) => void) => resolve(CERTIFICATE));

    qz.security.setSignatureAlgorithm('SHA512');
    qz.security.setSignaturePromise((toSign: string) =>
      (resolve: (v: string) => void, reject: (e: unknown) => void) =>
        this.sign(toSign).then(resolve).catch(reject)
    );
  }

  private async sign(message: string): Promise<string> {
    const key = await this.getPrivateKey();
    const data = new TextEncoder().encode(message);
    const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, data);
    return btoa(String.fromCharCode(...new Uint8Array(signature)));
  }

  private async getPrivateKey(): Promise<CryptoKey> {
    if (this.cryptoKey) return this.cryptoKey;
    const der = this.pemToDer(PRIVATE_KEY);
    this.cryptoKey = await crypto.subtle.importKey(
      'pkcs8',
      der,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-512' },
      false,
      ['sign']
    );
    return this.cryptoKey;
  }

  private pemToDer(pem: string): ArrayBuffer {
    const b64 = pem.replace(/-----[^-]+-----/g, '').replace(/\s/g, '');
    const bin = atob(b64);
    const buf = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
    return buf.buffer;
  }

  private buildEscPos(order: OrderResponse): object[] {
    const lines: object[] = [];

    const esc = (hex: string) => ({ type: 'raw', format: 'hex', data: hex.replace(/ /g, '') });
    const text = (t: string) => ({ type: 'raw', format: 'plain', data: t + '\n' });
    const cut = () => esc('1b 69');
    const boldOn = () => esc('1b 45 01');
    const boldOff = () => esc('1b 45 00');
    const centerOn = () => esc('1b 61 01');
    const centerOff = () => esc('1b 61 00');
    const dbl = () => esc('1b 21 30');
    const normal = () => esc('1b 21 00');
    const line = () => text('—'.repeat(COLS));

    const pad = (left: string, right: string): string => {
      const gap = COLS - left.length - right.length;
      return left + ' '.repeat(Math.max(1, gap)) + right;
    };

    const formatCOP = (v: number) => '$' + Math.round(v).toLocaleString('es-CO');

    const now = new Date();
    const dateStr = now.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: '2-digit' });
    const timeStr = now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

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

    lines.push(boldOn());
    lines.push(text('Cliente:'));
    lines.push(boldOff());
    lines.push(text(order.customerName));
    if (order.deliveryZone) lines.push(text(`Zona: ${order.deliveryZone}`));
    if (order.notes) lines.push(text(`Nota: ${order.notes}`));
    lines.push(line());

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

    if (order.deliveryFee && order.deliveryFee > 0) {
      lines.push(text(pad('Subtotal:', formatCOP(order.total - order.deliveryFee))));
      lines.push(text(pad('Domicilio:', formatCOP(order.deliveryFee))));
    }

    lines.push(boldOn(), dbl());
    lines.push(text(pad('TOTAL', formatCOP(order.total))));
    lines.push(normal(), boldOff());
    lines.push(line());

    lines.push(centerOn());
    lines.push(text('Gracias por tu pedido!'));
    lines.push(text(''));
    lines.push(text(''));
    lines.push(centerOff());
    lines.push(cut());

    return lines;
  }
}
