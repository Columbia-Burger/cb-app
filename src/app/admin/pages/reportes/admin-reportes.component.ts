import { Component, inject, signal, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { AdminService } from '../../services/admin.service';
import { DailyStatResponse, SourceStatResponse, HourlyStatResponse, TopProduct } from '../../models/admin.model';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

const SOURCE_LABELS: Record<string, string> = {
  WHATSAPP: 'WhatsApp',
  WAITER: 'Mesero',
  WEB: 'Web',
};
const SOURCE_COLORS: Record<string, string> = {
  WHATSAPP: '#3fb950',
  WAITER:   '#e94560',
  WEB:      '#58a6ff',
};

@Component({
  selector: 'app-admin-reportes',
  standalone: true,
  imports: [CurrencyPipe],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h2 class="page-title">Reportes</h2>
          <p class="page-sub">Análisis de ventas y comportamiento</p>
        </div>
        <div class="period-btns">
          @for (opt of periodOptions; track opt.days) {
            <button class="period-btn" [class.active]="period() === opt.days" (click)="setPeriod(opt.days)">
              {{ opt.label }}
            </button>
          }
        </div>
      </div>

      @if (loading()) {
        <div class="loading"><div class="spinner"></div> Cargando reportes...</div>
      }

      <!-- KPIs -->
      @if (!loading()) {
        <div class="kpi-grid">
          <div class="kpi-card accent">
            <div class="kpi-label">Pedidos en período</div>
            <div class="kpi-value">{{ totalOrders() }}</div>
          </div>
          <div class="kpi-card green">
            <div class="kpi-label">Ingresos en período</div>
            <div class="kpi-value">{{ totalRevenue() | currency:'COP':'symbol-narrow':'1.0-0' }}</div>
          </div>
          <div class="kpi-card yellow">
            <div class="kpi-label">Ticket promedio</div>
            <div class="kpi-value">{{ avgTicket() | currency:'COP':'symbol-narrow':'1.0-0' }}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Día más activo</div>
            <div class="kpi-value small">{{ bestDay() }}</div>
          </div>
        </div>

        <!-- Gráficas fila 1 -->
        <div class="charts-row">
          <div class="chart-card wide">
            <h3 class="chart-title">Ventas por día</h3>
            <canvas #salesChart></canvas>
          </div>
          <div class="chart-card">
            <h3 class="chart-title">Pedidos por canal</h3>
            <canvas #sourceChart></canvas>
            <div class="source-legend">
              @for (s of sourceStats(); track s.source) {
                <div class="legend-item">
                  <span class="legend-dot" [style.background]="sourceColor(s.source)"></span>
                  <span class="legend-label">{{ sourceLabel(s.source) }}</span>
                  <span class="legend-val">{{ s.orders }}</span>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Gráficas fila 2 -->
        <div class="charts-row">
          <div class="chart-card wide">
            <h3 class="chart-title">Pedidos por hora del día</h3>
            <canvas #hourChart></canvas>
          </div>
          <div class="chart-card">
            <h3 class="chart-title">🏆 Productos más vendidos</h3>
            <div class="top-list">
              @if (topProducts().length === 0) {
                <p class="empty">Sin datos aún.</p>
              }
              @for (p of topProducts(); track p.productName; let i = $index) {
                <div class="top-row">
                  <span class="top-rank">#{{ i + 1 }}</span>
                  <span class="top-name">{{ p.productName }}</span>
                  <span class="top-qty">{{ p.totalQuantity }} uds</span>
                  <span class="top-rev">{{ p.totalRevenue | currency:'COP':'symbol-narrow':'1.0-0' }}</span>
                </div>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    * { box-sizing: border-box; }
    .page { color: #c9d1d9; }
    .page-header {
      display: flex; align-items: flex-start; justify-content: space-between;
      gap: 1em; margin-bottom: 1.5em; flex-wrap: wrap;
    }
    .page-title { font-size: 1.5em; font-weight: 700; color: #e6edf3; margin: 0 0 0.2em; }
    .page-sub { color: #8b949e; font-size: 0.85em; margin: 0; }

    .period-btns { display: flex; gap: 0.4em; flex-wrap: wrap; }
    .period-btn {
      padding: 0.4em 0.9em; background: #21262d; border: 1px solid #30363d;
      border-radius: 20px; color: #8b949e; font-size: 0.8em; cursor: pointer; transition: all 0.15s;
    }
    .period-btn.active { background: #e94560; border-color: #e94560; color: #fff; }

    .loading { display: flex; align-items: center; gap: 0.75em; color: #8b949e; padding: 3em 0; }
    .spinner {
      width: 20px; height: 20px; border: 2px solid #30363d;
      border-top-color: #e94560; border-radius: 50%; animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* KPIs */
    .kpi-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 1em; margin-bottom: 1.5em;
    }
    .kpi-card {
      background: #161b22; border: 1px solid #21262d; border-radius: 12px; padding: 1.25em;
    }
    .kpi-card.accent { border-color: #e94560; }
    .kpi-card.green  { border-color: #3fb950; }
    .kpi-card.yellow { border-color: #d29922; }
    .kpi-label { font-size: 0.78em; color: #8b949e; margin-bottom: 0.5em; text-transform: uppercase; letter-spacing: 0.05em; }
    .kpi-value { font-size: 1.6em; font-weight: 700; color: #e6edf3; }
    .kpi-value.small { font-size: 1.1em; }

    /* Charts */
    .charts-row {
      display: grid; grid-template-columns: 2fr 1fr; gap: 1em; margin-bottom: 1.5em;
    }
    @media (max-width: 900px) { .charts-row { grid-template-columns: 1fr; } }
    .chart-card {
      background: #161b22; border: 1px solid #21262d; border-radius: 12px; padding: 1.25em;
    }
    .chart-title {
      font-size: 0.82em; font-weight: 600; color: #8b949e;
      text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 1em;
    }

    /* Source legend */
    .source-legend { margin-top: 1em; display: flex; flex-direction: column; gap: 0.5em; }
    .legend-item { display: flex; align-items: center; gap: 0.5em; font-size: 0.85em; }
    .legend-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
    .legend-label { flex: 1; color: #c9d1d9; }
    .legend-val { color: #e6edf3; font-weight: 600; }

    /* Top products */
    .top-list { display: flex; flex-direction: column; }
    .top-row {
      display: flex; align-items: center; gap: 0.75em;
      padding: 0.7em 0; border-bottom: 1px solid #21262d; font-size: 0.85em;
    }
    .top-row:last-child { border-bottom: none; }
    .top-rank { color: #e94560; font-weight: 700; width: 1.8em; flex-shrink: 0; }
    .top-name { flex: 1; color: #e6edf3; }
    .top-qty { color: #8b949e; min-width: 55px; text-align: right; }
    .top-rev { color: #3fb950; font-weight: 600; min-width: 90px; text-align: right; }
    .empty { color: #8b949e; font-size: 0.85em; }
  `]
})
export class AdminReportesComponent implements OnInit, AfterViewInit, OnDestroy {
  private svc = inject(AdminService);

  @ViewChild('salesChart')  salesChartRef!:  ElementRef<HTMLCanvasElement>;
  @ViewChild('sourceChart') sourceChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('hourChart')   hourChartRef!:   ElementRef<HTMLCanvasElement>;

  loading    = signal(true);
  period     = signal(7);
  dailyStats = signal<DailyStatResponse[]>([]);
  sourceStats = signal<SourceStatResponse[]>([]);
  hourlyStats = signal<HourlyStatResponse[]>([]);
  topProducts = signal<TopProduct[]>([]);

  periodOptions = [
    { days: 7,  label: '7 días'  },
    { days: 14, label: '14 días' },
    { days: 30, label: '30 días' },
  ];

  private salesChart?:  Chart;
  private sourceChart?: Chart;
  private hourChart?:   Chart;
  private chartsReady = false;

  totalOrders = () => this.dailyStats().reduce((s, d) => s + d.orders, 0);
  totalRevenue = () => this.dailyStats().reduce((s, d) => s + Number(d.revenue), 0);
  avgTicket = () => {
    const orders = this.totalOrders();
    return orders > 0 ? this.totalRevenue() / orders : 0;
  };
  bestDay = () => {
    const data = this.dailyStats();
    if (!data.length) return '—';
    const best = data.reduce((a, b) => b.orders > a.orders ? b : a);
    if (best.orders === 0) return '—';
    const [, m, d] = best.date.split('-');
    return `${d}/${m} (${best.orders} pedidos)`;
  };

  sourceLabel = (s: string) => SOURCE_LABELS[s] ?? s;
  sourceColor  = (s: string) => SOURCE_COLORS[s] ?? '#8b949e';

  ngOnInit(): void {
    this.loadAll();
  }

  ngAfterViewInit(): void {
    this.chartsReady = true;
    if (!this.loading()) this.renderAll();
  }

  ngOnDestroy(): void {
    this.salesChart?.destroy();
    this.sourceChart?.destroy();
    this.hourChart?.destroy();
  }

  setPeriod(days: number): void {
    this.period.set(days);
    this.loading.set(true);
    this.svc.getDailyStats(days).subscribe({
      next: data => {
        this.dailyStats.set(data);
        this.loading.set(false);
        setTimeout(() => this.renderSalesChart(), 0);
      },
      error: () => this.loading.set(false)
    });
  }

  private loadAll(): void {
    let pending = 3;
    const done = () => { if (--pending === 0) { this.loading.set(false); setTimeout(() => this.renderAll(), 0); } };

    this.svc.getDailyStats(this.period()).subscribe({ next: d => { this.dailyStats.set(d); done(); }, error: done });
    this.svc.getStatsBySource().subscribe({ next: d => { this.sourceStats.set(d); done(); }, error: done });
    this.svc.getStatsByHour().subscribe({ next: d => { this.hourlyStats.set(d); done(); }, error: done });
    this.svc.getTopProducts(10).subscribe({ next: d => this.topProducts.set(d) });
  }

  private renderAll(): void {
    if (!this.chartsReady) return;
    this.renderSalesChart();
    this.renderSourceChart();
    this.renderHourChart();
  }

  private renderSalesChart(): void {
    if (!this.salesChartRef) return;
    const data = this.dailyStats();
    const labels = data.map(d => { const [,m,day] = d.date.split('-'); return `${day}/${m}`; });

    this.salesChart?.destroy();
    this.salesChart = new Chart(this.salesChartRef.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Pedidos',
            data: data.map(d => d.orders),
            backgroundColor: 'rgba(233,69,96,0.7)',
            borderColor: '#e94560',
            borderWidth: 1,
            borderRadius: 5,
            yAxisID: 'yOrders',
          },
          {
            label: 'Ingresos',
            data: data.map(d => Number(d.revenue)),
            type: 'line',
            borderColor: '#3fb950',
            backgroundColor: 'rgba(63,185,80,0.1)',
            borderWidth: 2,
            pointRadius: 3,
            fill: true,
            tension: 0.3,
            yAxisID: 'yRevenue',
          }
        ]
      },
      options: {
        responsive: true,
        interaction: { mode: 'index', intersect: false },
        plugins: { legend: { labels: { color: '#8b949e', font: { size: 11 } } } },
        scales: {
          x: { ticks: { color: '#8b949e' }, grid: { color: '#21262d' } },
          yOrders:  { position: 'left',  ticks: { color: '#e94560', stepSize: 1 }, grid: { color: '#21262d' }, beginAtZero: true },
          yRevenue: { position: 'right', ticks: { color: '#3fb950', callback: (v) => '$' + Number(v).toLocaleString('es-CO') }, grid: { drawOnChartArea: false }, beginAtZero: true },
        }
      }
    });
  }

  private renderSourceChart(): void {
    if (!this.sourceChartRef) return;
    const data = this.sourceStats();
    if (!data.length) return;

    this.sourceChart?.destroy();
    this.sourceChart = new Chart(this.sourceChartRef.nativeElement, {
      type: 'doughnut',
      data: {
        labels: data.map(d => this.sourceLabel(d.source)),
        datasets: [{
          data: data.map(d => d.orders),
          backgroundColor: data.map(d => this.sourceColor(d.source)),
          borderColor: '#161b22',
          borderWidth: 3,
        }]
      },
      options: {
        responsive: true,
        cutout: '65%',
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (ctx) => ` ${ctx.label}: ${ctx.raw} pedidos` } }
        }
      }
    });
  }

  private renderHourChart(): void {
    if (!this.hourChartRef) return;
    const data = this.hourlyStats();
    if (!data.length) return;

    const allHours = Array.from({ length: 24 }, (_, i) => i);
    const ordersByHour = allHours.map(h => data.find(d => d.hour === h)?.orders ?? 0);
    const labels = allHours.map(h => `${String(h).padStart(2, '0')}:00`);

    this.hourChart?.destroy();
    this.hourChart = new Chart(this.hourChartRef.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Pedidos',
          data: ordersByHour,
          backgroundColor: ordersByHour.map(v => v > 0 ? 'rgba(188,140,255,0.7)' : 'rgba(33,38,45,0.5)'),
          borderColor: ordersByHour.map(v => v > 0 ? '#bc8cff' : '#21262d'),
          borderWidth: 1,
          borderRadius: 4,
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: '#8b949e', maxRotation: 45, font: { size: 10 } }, grid: { color: '#21262d' } },
          y: { ticks: { color: '#8b949e', stepSize: 1 }, grid: { color: '#21262d' }, beginAtZero: true }
        }
      }
    });
  }
}
