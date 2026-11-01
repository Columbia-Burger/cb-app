import { Component, inject, signal, computed, OnInit, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../services/admin.service';
import { DashboardStats, TopProduct, DailyStatResponse, SourceStatResponse } from '../../models/admin.model';
import { Chart, registerables } from 'chart.js';
import { IconComponent } from '../../../shared/icon.component';

Chart.register(...registerables);

const SOURCE_LABELS: Record<string, string> = { WEB: 'Web', WHATSAPP: 'WhatsApp', WAITER: 'Mesero', DELIVERY: 'Domicilio' };
// Misma paleta categórica validada que Reportes
const SOURCE_COLORS: Record<string, string> = { WEB: '#3987e5', WHATSAPP: '#d95926', WAITER: '#199e70', DELIVERY: '#c98500' };

@Component({
    selector: 'app-admin-dashboard',
    imports: [CurrencyPipe, DecimalPipe, RouterLink, IconComponent],
    templateUrl: './admin-dashboard.component.html',
    styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  private adminService = inject(AdminService);

  private salesChart?: Chart;
  private salesCanvas?: ElementRef<HTMLCanvasElement>;

  // El canvas aparece cuando llegan los datos (está dentro de @if): se dibuja al recibirlo
  @ViewChild('salesChart') set salesChartRef(ref: ElementRef<HTMLCanvasElement> | undefined) {
    this.salesCanvas = ref;
    if (ref) requestAnimationFrame(() => this.renderSalesChart());
  }

  readonly username = this.adminService.getCurrentUsername() ?? '';
  readonly today = new Intl.DateTimeFormat('es-CO', {
    weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Bogota',
  }).format(new Date());

  loading = signal(true);
  stats = signal<DashboardStats | null>(null);
  topProducts = signal<TopProduct[]>([]);
  dailyStats = signal<DailyStatResponse[]>([]);
  sourceStats = signal<SourceStatResponse[]>([]);

  ticketPromedio = computed(() => {
    const s = this.stats();
    return s && s.ordersToday > 0 ? s.revenueToday / s.ordersToday : 0;
  });

  weekRevenue = computed(() => this.dailyStats().reduce((sum, d) => sum + Number(d.revenue), 0));
  weekOrders = computed(() => this.dailyStats().reduce((sum, d) => sum + d.orders, 0));
  maxSource = computed(() => Math.max(1, ...this.sourceStats().map(s => s.orders)));
  totalSource = computed(() => this.sourceStats().reduce((sum, s) => sum + s.orders, 0));
  maxProduct = computed(() => Math.max(1, ...this.topProducts().map(p => p.totalQuantity)));

  ngOnInit(): void {
    this.adminService.getStats().subscribe({
      next: data => { this.stats.set(data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
    this.adminService.getTopProducts(8).subscribe({ next: data => this.topProducts.set(data) });
    this.adminService.getDailyStats(7).subscribe({
      next: data => {
        this.dailyStats.set(data);
        requestAnimationFrame(() => this.renderSalesChart());
      }
    });
    this.adminService.getStatsBySource().subscribe({ next: data => this.sourceStats.set(data) });
  }

  ngOnDestroy(): void {
    this.salesChart?.destroy();
  }

  roundRating(rating: number): number {
    return Math.round(rating);
  }

  sourceLabel(source: string): string {
    return SOURCE_LABELS[source] ?? source;
  }

  sourceColor(source: string): string {
    return SOURCE_COLORS[source] ?? '#6e7681';
  }

  private renderSalesChart(): void {
    const data = this.dailyStats();
    if (!this.salesCanvas || !data.length) return;
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#f3a51f';
    const weekday = new Intl.DateTimeFormat('es-CO', { weekday: 'short', timeZone: 'UTC' });
    const labels = data.map(d => {
      const [, m, day] = d.date.split('-');
      return `${weekday.format(new Date(d.date + 'T12:00:00Z')).replace('.', '')} ${day}/${m}`;
    });
    const money = (v: number) => '$' + Math.round(v).toLocaleString('es-CO');

    this.salesChart?.destroy();
    this.salesChart = new Chart(this.salesCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          data: data.map(d => Number(d.revenue)),
          backgroundColor: accent,
          hoverBackgroundColor: '#ffb836',
          borderRadius: { topLeft: 6, topRight: 6 },
          borderSkipped: 'bottom',
          maxBarThickness: 44,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#0b0e13',
            borderColor: '#232a34',
            borderWidth: 1,
            padding: 10,
            displayColors: false,
            titleColor: '#e8ebf0',
            bodyColor: '#e8ebf0',
            footerColor: '#8b94a2',
            footerFont: { weight: 'normal' },
            callbacks: {
              label: ctx => money(Number(ctx.raw)),
              footer: items => `${data[items[0].dataIndex].orders} pedidos`,
            },
          },
        },
        scales: {
          x: { ticks: { color: '#8b94a2', font: { size: 11 } }, grid: { display: false }, border: { color: '#232a34' } },
          y: {
            beginAtZero: true,
            border: { display: false },
            grid: { color: '#1b2029' },
            ticks: {
              color: '#8b94a2',
              font: { size: 11 },
              maxTicksLimit: 5,
              callback: v => {
                const n = Number(v);
                return n >= 1_000_000 ? '$' + (n / 1_000_000).toLocaleString('es-CO', { maximumFractionDigits: 1 }) + ' M'
                  : n >= 1000 ? '$' + Math.round(n / 1000) + ' mil' : '$' + n;
              },
            },
          },
        },
      },
    });
  }
}
