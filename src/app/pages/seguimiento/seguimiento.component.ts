import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { environment } from '../../../environments/environment';
import { OrderTrackingResponse, OrderStatus } from '../../admin/models/admin.model';

interface Step {
  status: OrderStatus;
  label: string;
  icon: string;
}

const STEPS: Step[] = [
  { status: 'RECEIVED',   label: 'Pedido recibido',   icon: '📋' },
  { status: 'PREPARING',  label: 'En preparación',    icon: '👨‍🍳' },
  { status: 'ON_THE_WAY', label: 'En camino',         icon: '🛵' },
  { status: 'DELIVERED',  label: 'Entregado',         icon: '✅' },
];

const STATUS_ORDER: Record<string, number> = {
  RECEIVED: 0, PREPARING: 1, ON_THE_WAY: 2, DELIVERED: 3, CANCELLED: -1
};

@Component({
  selector: 'app-seguimiento',
  standalone: true,
  imports: [CurrencyPipe, DatePipe],
  template: `
    <div class="page">
      <header class="header">
        <img src="assets/logo.png" alt="Columbia Burger" class="logo" />
        <div class="brand-text">
          <span class="brand-name">Columbia Burger</span>
          <span class="brand-sub">Seguimiento de pedido</span>
        </div>
      </header>

      @if (loading()) {
        <div class="centered">
          <div class="spinner"></div>
          <span>Cargando...</span>
        </div>
      } @else if (error()) {
        <div class="centered error-box">
          <span class="error-icon">⚠️</span>
          <p>{{ error() }}</p>
        </div>
      } @else if (order()) {
        <div class="card">
          <!-- Order header -->
          <div class="order-header">
            <div>
              <p class="order-greeting">Hola, <strong>{{ order()!.customerFirstName }}</strong></p>
              <p class="order-id">Pedido #{{ order()!.id }}</p>
            </div>
            <div class="order-time">
              {{ order()!.createdAt | date:'d MMM, h:mm a' }}
            </div>
          </div>

          @if (order()!.status === 'CANCELLED') {
            <div class="cancelled-banner">
              ❌ Este pedido fue cancelado
            </div>
          } @else {
            <!-- Timeline -->
            <div class="timeline">
              @for (step of steps; track step.status; let i = $index) {
                <div class="timeline-step" [class.done]="isDone(step.status)" [class.active]="isActive(step.status)">
                  <div class="step-icon-wrap">
                    <div class="step-icon">{{ step.icon }}</div>
                    @if (i < steps.length - 1) {
                      <div class="step-line" [class.done]="isDone(steps[i + 1].status) || isActive(steps[i + 1].status)"></div>
                    }
                  </div>
                  <div class="step-label">{{ step.label }}</div>
                </div>
              }
            </div>

            <div class="status-pill" [class]="'status-' + order()!.status.toLowerCase()">
              {{ statusLabel(order()!.status) }}
            </div>
          }

          <!-- Items -->
          <div class="section">
            <h3 class="section-title">Productos</h3>
            <ul class="items-list">
              @for (item of order()!.items; track $index) {
                <li class="item-row">
                  <span class="item-qty">{{ item.quantity }}×</span>
                  <span class="item-name">{{ item.productName }}</span>
                  @if (item.flavor) {
                    <span class="item-flavor">{{ item.flavor }}</span>
                  }
                </li>
              }
            </ul>
          </div>

          <!-- Totals -->
          <div class="section totals">
            @if (order()!.deliveryFee > 0) {
              <div class="total-row">
                <span>Domicilio</span>
                <span>{{ order()!.deliveryFee | currency:'COP':'symbol-narrow':'1.0-0' }}</span>
              </div>
            }
            <div class="total-row grand">
              <span>Total</span>
              <span>{{ order()!.total | currency:'COP':'symbol-narrow':'1.0-0' }}</span>
            </div>
          </div>

          @if (order()!.deliveryZone) {
            <p class="delivery-zone">📍 {{ order()!.deliveryZone }}</p>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    * { box-sizing: border-box; }

    .page {
      min-height: 100vh;
      background: #0d1117;
      color: #c9d1d9;
      padding: 1.5em 1em 3em;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }

    .header {
      display: flex;
      align-items: center;
      gap: 0.75em;
      margin-bottom: 2em;
      max-width: 480px;
      margin-left: auto;
      margin-right: auto;
    }
    .logo {
      width: 48px; height: 48px;
      border-radius: 12px;
      background: #fff;
      padding: 4px;
      object-fit: contain;
      box-shadow: 0 2px 12px rgba(233,69,96,0.25);
    }
    .brand-name { display: block; font-weight: 700; font-size: 1em; color: #e6edf3; }
    .brand-sub  { display: block; font-size: 0.75em; color: #8b949e; }

    .centered {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1em;
      padding: 4em 1em;
      color: #8b949e;
    }
    .spinner {
      width: 32px; height: 32px;
      border: 3px solid #21262d;
      border-top-color: #e94560;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .error-box { color: #f85149; }
    .error-icon { font-size: 2em; }

    .card {
      max-width: 480px;
      margin: 0 auto;
      background: #161b22;
      border: 1px solid #21262d;
      border-radius: 16px;
      padding: 1.5em;
    }

    .order-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5em;
      gap: 1em;
      flex-wrap: wrap;
    }
    .order-greeting { margin: 0 0 0.2em; font-size: 1em; color: #e6edf3; }
    .order-id { margin: 0; font-size: 0.8em; color: #8b949e; }
    .order-time { font-size: 0.78em; color: #8b949e; text-align: right; }

    .cancelled-banner {
      background: rgba(248,81,73,0.12);
      color: #f85149;
      border: 1px solid rgba(248,81,73,0.25);
      border-radius: 10px;
      padding: 0.85em 1em;
      text-align: center;
      font-weight: 600;
      margin-bottom: 1.5em;
    }

    /* Timeline */
    .timeline {
      display: flex;
      justify-content: space-between;
      margin-bottom: 1em;
      padding: 0 0.25em;
    }
    .timeline-step {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.4em;
      flex: 1;
      position: relative;
    }
    .step-icon-wrap {
      display: flex;
      align-items: center;
      width: 100%;
      position: relative;
    }
    .step-icon {
      width: 40px; height: 40px;
      border-radius: 50%;
      background: #21262d;
      border: 2px solid #30363d;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1em;
      flex-shrink: 0;
      transition: all 0.3s;
      z-index: 1;
    }
    .timeline-step.done .step-icon {
      background: rgba(63,185,80,0.15);
      border-color: #3fb950;
    }
    .timeline-step.active .step-icon {
      background: rgba(233,69,96,0.15);
      border-color: #e94560;
      box-shadow: 0 0 0 4px rgba(233,69,96,0.15);
    }
    .step-line {
      flex: 1;
      height: 2px;
      background: #30363d;
      transition: background 0.3s;
    }
    .step-line.done { background: #3fb950; }
    .step-label {
      font-size: 0.65em;
      color: #8b949e;
      text-align: center;
      line-height: 1.3;
      max-width: 60px;
    }
    .timeline-step.done .step-label,
    .timeline-step.active .step-label { color: #c9d1d9; }

    .status-pill {
      text-align: center;
      font-size: 0.8em;
      font-weight: 600;
      padding: 0.4em 1em;
      border-radius: 20px;
      margin: 0.75em auto 1.5em;
      width: fit-content;
    }
    .status-received   { background: rgba(88,166,255,0.12); color: #58a6ff; }
    .status-preparing  { background: rgba(255,166,0,0.12);  color: #f0b429; }
    .status-on_the_way { background: rgba(63,185,80,0.12);  color: #3fb950; }
    .status-delivered  { background: rgba(63,185,80,0.18);  color: #3fb950; }
    .status-cancelled  { background: rgba(248,81,73,0.12);  color: #f85149; }

    .section { margin-top: 1.25em; }
    .section-title {
      font-size: 0.8em;
      font-weight: 700;
      color: #8b949e;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin: 0 0 0.75em;
    }

    .items-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.5em; }
    .item-row { display: flex; align-items: center; gap: 0.5em; font-size: 0.88em; }
    .item-qty { color: #e94560; font-weight: 700; min-width: 1.8em; }
    .item-name { color: #e6edf3; flex: 1; }
    .item-flavor { color: #8b949e; font-size: 0.85em; }

    .totals { border-top: 1px solid #21262d; padding-top: 1em; }
    .total-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.85em;
      color: #8b949e;
      margin-bottom: 0.4em;
    }
    .total-row.grand { font-weight: 700; font-size: 1em; color: #e6edf3; margin-top: 0.5em; }

    .delivery-zone {
      margin: 1em 0 0;
      font-size: 0.8em;
      color: #8b949e;
      text-align: center;
    }
  `]
})
export class SeguimientoComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);

  loading = signal(true);
  order = signal<OrderTrackingResponse | null>(null);
  error = signal<string | null>(null);

  steps = STEPS;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set('ID de pedido inválido.');
      this.loading.set(false);
      return;
    }
    this.http.get<OrderTrackingResponse>(`${environment.businessApiUrl}/api/orders/${id}/tracking`)
      .subscribe({
        next: data => {
          this.order.set(data);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Pedido no encontrado. Verifica el enlace.');
          this.loading.set(false);
        }
      });
  }

  isDone(status: OrderStatus): boolean {
    const current = this.order()?.status;
    if (!current) return false;
    return STATUS_ORDER[status] < STATUS_ORDER[current];
  }

  isActive(status: OrderStatus): boolean {
    return this.order()?.status === status;
  }

  statusLabel(status: OrderStatus): string {
    const labels: Record<OrderStatus, string> = {
      RECEIVED:   'Pedido recibido',
      PREPARING:  'En preparación',
      ON_THE_WAY: 'En camino',
      DELIVERED:  'Entregado',
      CANCELLED:  'Cancelado'
    };
    return labels[status] ?? status;
  }
}
