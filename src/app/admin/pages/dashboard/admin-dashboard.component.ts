import { Component, inject, signal, OnInit, AfterViewInit, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { AdminService } from '../../services/admin.service';
import { DashboardStats, TopProduct, DailyStatResponse, SourceStatResponse } from '../../models/admin.model';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CurrencyPipe, DecimalPipe],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  private adminService = inject(AdminService);

  @ViewChild('ordersChart') ordersChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('revenueChart') revenueChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('sourceChart') sourceChartRef!: ElementRef<HTMLCanvasElement>;

  loading = signal(true);
  stats = signal<DashboardStats | null>(null);
  topProducts = signal<TopProduct[]>([]);
  dailyStats = signal<DailyStatResponse[]>([]);
  sourceStats = signal<SourceStatResponse[]>([]);

  private ordersChart?: Chart;
  private revenueChart?: Chart;
  private sourceChart?: Chart;

  ngOnInit(): void {
    this.adminService.getStats().subscribe({
      next: data => { this.stats.set(data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });

    this.adminService.getTopProducts(10).subscribe({
      next: data => this.topProducts.set(data)
    });

    this.adminService.getDailyStats(7).subscribe({
      next: data => {
        this.dailyStats.set(data);
        setTimeout(() => this.renderBarCharts(data), 0);
      }
    });

    this.adminService.getStatsBySource().subscribe({
      next: data => {
        this.sourceStats.set(data);
        setTimeout(() => this.renderSourceChart(data), 0);
      }
    });
  }

  ngAfterViewInit(): void { }

  ngOnDestroy(): void {
    this.ordersChart?.destroy();
    this.revenueChart?.destroy();
    this.sourceChart?.destroy();
  }

  starsArray(rating: number | null): number[] {
    if (!rating) return [];
    return Array.from({ length: 5 }, (_, i) => i + 1);
  }

  starFill(index: number, rating: number | null): string {
    if (!rating) return 'empty';
    if (index <= Math.floor(rating)) return 'full';
    if (index <= rating + 0.5) return 'half';
    return 'empty';
  }

  ticketPromedio(): number {
    const s = this.stats();
    if (!s || s.ordersToday === 0) return 0;
    return s.revenueToday / s.ordersToday;
  }

  sourceLabel(source: string): string {
    const map: Record<string, string> = { WEB: 'Web', WHATSAPP: 'WhatsApp', WAITER: 'Mesero' };
    return map[source] ?? source;
  }

  private renderBarCharts(data: DailyStatResponse[]): void {
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
            ticks: { color: '#8b949e', callback: (v) => '$' + Number(v).toLocaleString('es-CO') },
            grid: { color: '#21262d' },
            beginAtZero: true
          }
        }
      }
    });
  }

  private renderSourceChart(data: SourceStatResponse[]): void {
    if (!this.sourceChartRef || data.length === 0) return;

    this.sourceChart?.destroy();
    this.sourceChart = new Chart(this.sourceChartRef.nativeElement, {
      type: 'doughnut',
      data: {
        labels: data.map(d => this.sourceLabel(d.source)),
        datasets: [{
          data: data.map(d => d.orders),
          backgroundColor: ['rgba(233,69,96,0.8)', 'rgba(63,185,80,0.8)', 'rgba(56,139,253,0.8)'],
          borderColor: ['#e94560', '#3fb950', '#388bfd'],
          borderWidth: 2,
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom', labels: { color: '#8b949e', padding: 16, font: { size: 12 } } }
        },
        cutout: '65%',
      }
    });
  }
}
