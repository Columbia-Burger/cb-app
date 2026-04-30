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
  templateUrl: './admin-reportes.component.html',
  styleUrl: './admin-reportes.component.scss',
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
