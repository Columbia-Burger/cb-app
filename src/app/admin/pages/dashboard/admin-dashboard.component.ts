import { Component, inject, signal, OnInit, AfterViewInit, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { AdminService } from '../../services/admin.service';
import { DashboardStats, TopProduct, DailyStatResponse } from '../../models/admin.model';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CurrencyPipe],
  template: `
    <div class="page">
      <h2 class="page-title">Dashboard</h2>

      @if (loading()) {
        <div class="loading">Cargando métricas...</div>
      }

      @if (stats()) {
        <div class="stats-grid">
          <div class="stat-card accent">
            <div class="stat-label">Pedidos hoy</div>
            <div class="stat-value">{{ stats()!.ordersToday }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Pedidos esta semana</div>
            <div class="stat-value">{{ stats()!.ordersThisWeek }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Pedidos este mes</div>
            <div class="stat-value">{{ stats()!.ordersThisMonth }}</div>
          </div>
          <div class="stat-card green">
            <div class="stat-label">Ingresos hoy</div>
            <div class="stat-value">{{ stats()!.revenueToday | currency:'COP':'symbol-narrow':'1.0-0' }}</div>
          </div>
          <div class="stat-card green">
            <div class="stat-label">Ingresos este mes</div>
            <div class="stat-value">{{ stats()!.revenueThisMonth | currency:'COP':'symbol-narrow':'1.0-0' }}</div>
          </div>
          <div class="stat-card yellow">
            <div class="stat-label">Pendientes / En camino</div>
            <div class="stat-value">{{ stats()!.pendingOrders }} / {{ stats()!.onTheWayOrders }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Total clientes</div>
            <div class="stat-value">{{ stats()!.totalCustomers }}</div>
          </div>
        </div>
      }

      <!-- Gráficas — siempre en DOM para que ViewChild funcione -->
      <div class="charts-grid" [style.display]="dailyStats().length ? 'grid' : 'none'">
        <div class="chart-card">
          <h3 class="chart-title">Pedidos últimos 7 días</h3>
          <canvas #ordersChart></canvas>
        </div>
        <div class="chart-card">
          <h3 class="chart-title">Ingresos últimos 7 días</h3>
          <canvas #revenueChart></canvas>
        </div>
      </div>

      @if (!loading() && stats()) {
        <!-- Top productos -->
        <div class="section">
          <h3 class="section-title">🏆 Productos más vendidos</h3>
          @if (topProducts().length === 0) {
            <p class="empty">Aún no hay pedidos registrados.</p>
          } @else {
            <div class="top-products">
              @for (p of topProducts(); track p.productName; let i = $index) {
                <div class="product-row">
                  <span class="rank">#{{ i + 1 }}</span>
                  <span class="product-name">{{ p.productName }}</span>
                  <span class="qty">{{ p.totalQuantity }} uds</span>
                  <span class="revenue">{{ p.totalRevenue | currency:'COP':'symbol-narrow':'1.0-0' }}</span>
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .page { color: #c9d1d9; }
    .page-title { font-size: 1.5em; font-weight: 700; color: #e6edf3; margin: 0 0 1.5em; }
    .loading { color: #8b949e; }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 1em;
      margin-bottom: 2em;
    }
    .stat-card {
      background: #161b22;
      border: 1px solid #21262d;
      border-radius: 12px;
      padding: 1.25em;
    }
    .stat-card.accent { border-color: #e94560; }
    .stat-card.green { border-color: #3fb950; }
    .stat-card.yellow { border-color: #d29922; }
    .stat-label { font-size: 0.8em; color: #8b949e; margin-bottom: 0.5em; text-transform: uppercase; letter-spacing: 0.05em; }
    .stat-value { font-size: 1.6em; font-weight: 700; color: #e6edf3; }

    .charts-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1em;
      margin-bottom: 2em;
    }
    @media (max-width: 768px) {
      .charts-grid { grid-template-columns: 1fr; }
    }
    .chart-card {
      background: #161b22;
      border: 1px solid #21262d;
      border-radius: 12px;
      padding: 1.25em;
    }
    .chart-title { font-size: 0.9em; font-weight: 600; color: #8b949e; margin: 0 0 1em; text-transform: uppercase; letter-spacing: 0.05em; }

    .section { margin-top: 2em; }
    .section-title { font-size: 1.1em; font-weight: 600; color: #e6edf3; margin: 0 0 1em; }
    .empty { color: #8b949e; font-size: 0.9em; }
    .top-products { background: #161b22; border: 1px solid #21262d; border-radius: 12px; overflow: hidden; }
    .product-row { display: flex; align-items: center; gap: 1em; padding: 0.85em 1.25em; border-bottom: 1px solid #21262d; }
    .product-row:last-child { border-bottom: none; }
    .rank { width: 2em; color: #e94560; font-weight: 700; font-size: 0.85em; }
    .product-name { flex: 1; font-size: 0.95em; }
    .qty { color: #8b949e; font-size: 0.85em; min-width: 60px; text-align: right; }
    .revenue { color: #3fb950; font-weight: 600; font-size: 0.9em; min-width: 100px; text-align: right; }
  `]
})
export class AdminDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  private adminService = inject(AdminService);

  @ViewChild('ordersChart') ordersChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('revenueChart') revenueChartRef!: ElementRef<HTMLCanvasElement>;

  loading = signal(true);
  stats = signal<DashboardStats | null>(null);
  topProducts = signal<TopProduct[]>([]);
  dailyStats = signal<DailyStatResponse[]>([]);

  private ordersChart?: Chart;
  private revenueChart?: Chart;

  ngOnInit(): void {
    this.adminService.getStats().subscribe({
      next: data => {
        this.stats.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });

    this.adminService.getTopProducts(10).subscribe({
      next: data => this.topProducts.set(data)
    });

    this.adminService.getDailyStats(7).subscribe({
      next: data => {
        this.dailyStats.set(data);
        setTimeout(() => this.renderCharts(data), 0);
      }
    });
  }

  ngAfterViewInit(): void { }

  ngOnDestroy(): void {
    this.ordersChart?.destroy();
    this.revenueChart?.destroy();
  }

  private renderCharts(data: DailyStatResponse[]): void {
    if (!this.ordersChartRef || !this.revenueChartRef) return;

    const labels = data.map(d => {
      const [, month, day] = d.date.split('-');
      return `${day}/${month}`;
    });

    this.ordersChart?.destroy();
    this.ordersChart = new Chart(this.ordersChartRef.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Pedidos',
          data: data.map(d => d.orders),
          backgroundColor: 'rgba(233, 69, 96, 0.7)',
          borderColor: '#e94560',
          borderWidth: 1,
          borderRadius: 6,
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: '#8b949e' }, grid: { color: '#21262d' } },
          y: { ticks: { color: '#8b949e', stepSize: 1 }, grid: { color: '#21262d' }, beginAtZero: true }
        }
      }
    });

    this.revenueChart?.destroy();
    this.revenueChart = new Chart(this.revenueChartRef.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Ingresos COP',
          data: data.map(d => d.revenue),
          backgroundColor: 'rgba(63, 185, 80, 0.7)',
          borderColor: '#3fb950',
          borderWidth: 1,
          borderRadius: 6,
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: '#8b949e' }, grid: { color: '#21262d' } },
          y: {
            ticks: {
              color: '#8b949e',
              callback: (v) => '$' + Number(v).toLocaleString('es-CO')
            },
            grid: { color: '#21262d' },
            beginAtZero: true
          }
        }
      }
    });
  }
}
