import { Component, ElementRef, OnDestroy, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe, DecimalPipe, NgTemplateOutlet } from '@angular/common';
import { HttpResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { AdminService } from '../../services/admin.service';
import { ReportGroupRow, ReportResponse } from '../../models/admin.model';

Chart.register(...registerables);

type PresetId = 'today' | 'yesterday' | '7d' | '30d' | 'month' | 'lastMonth' | 'custom';

const SOURCE_LABELS: Record<string, string> = { WEB: 'Web', WHATSAPP: 'WhatsApp', WAITER: 'Mesero', DELIVERY: 'Domicilio' };
// Paleta categórica validada (colorblind-safe) sobre la superficie oscura #161b22, en orden fijo
const SOURCE_COLORS: Record<string, string> = { WEB: '#3987e5', WHATSAPP: '#d95926', WAITER: '#199e70', DELIVERY: '#c98500' };
const STATUS_LABELS: Record<string, string> = {
  RECEIVED: 'Recibido', PREPARING: 'En preparación', ON_THE_WAY: 'En camino', DELIVERED: 'Entregado', CANCELLED: 'Cancelado',
};
const SERIES_COLOR = '#3987e5';
const AXIS_INK = '#8b949e';
const GRID = '#21262d';

/** Fecha de hoy en Bogotá como YYYY-MM-DD (independiente de la zona del dispositivo). */
function bogotaToday(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date());
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function shortDate(iso: string): string {
  const [, m, d] = iso.split('-');
  return `${d}/${m}`;
}

@Component({
    selector: 'app-admin-reportes',
    imports: [CurrencyPipe, DatePipe, DecimalPipe, FormsModule, NgTemplateOutlet],
    templateUrl: './admin-reportes.component.html',
    styleUrl: './admin-reportes.component.scss'
})
export class AdminReportesComponent implements OnInit, OnDestroy {
  private svc = inject(AdminService);

  // Los canvas se recrean cada vez que cambia el periodo (están dentro de @if). Se dibuja cuando
  // Angular los entrega, no con un setTimeout, que puede correr antes de que existan.
  private dailyChartRef?: ElementRef<HTMLCanvasElement>;
  private hourChartRef?: ElementRef<HTMLCanvasElement>;
  private renderQueued = false;

  @ViewChild('dailyChart') set dailyCanvas(ref: ElementRef<HTMLCanvasElement> | undefined) {
    this.dailyChartRef = ref;
    if (ref) this.queueRender();
  }

  @ViewChild('hourChart') set hourCanvas(ref: ElementRef<HTMLCanvasElement> | undefined) {
    this.hourChartRef = ref;
    if (ref) this.queueRender();
  }

  /** Agrupa los avisos de ambos canvas en un solo dibujado. */
  private queueRender(): void {
    if (this.renderQueued) return;
    this.renderQueued = true;
    requestAnimationFrame(() => {
      this.renderQueued = false;
      this.renderCharts();
    });
  }

  readonly presets: { id: PresetId; label: string }[] = [
    { id: 'today', label: 'Hoy' },
    { id: 'yesterday', label: 'Ayer' },
    { id: '7d', label: '7 días' },
    { id: '30d', label: '30 días' },
    { id: 'month', label: 'Este mes' },
    { id: 'lastMonth', label: 'Mes pasado' },
    { id: 'custom', label: 'Fechas…' },
  ];

  preset = signal<PresetId>('today');
  from = signal(bogotaToday());
  to = signal(bogotaToday());
  customFrom = bogotaToday();
  customTo = bogotaToday();
  readonly maxDate = bogotaToday();

  report = signal<ReportResponse | null>(null);
  loading = signal(true);
  error = signal('');
  exporting = signal(false);
  showAllProducts = signal(false);

  private dailyChart?: Chart;
  private hourChart?: Chart;

  isSingleDay = computed(() => this.from() === this.to());

  rangeLabel = computed(() => {
    const f = this.from(), t = this.to();
    if (f === t) return f === bogotaToday() ? 'Hoy' : this.longDate(f);
    return `${this.longDate(f)} – ${this.longDate(t)}`;
  });

  previousLabel = computed(() => {
    const p = this.report()?.previous;
    if (!p) return '';
    return p.from === p.to ? this.longDate(p.from) : `${shortDate(p.from)} – ${shortDate(p.to)}`;
  });

  visibleProducts = computed(() => {
    const all = this.report()?.topProducts ?? [];
    return this.showAllProducts() ? all : all.slice(0, 10);
  });

  maxProductQty = computed(() => Math.max(1, ...(this.report()?.topProducts ?? []).map(p => p.quantity)));

  hasSales = computed(() => (this.report()?.summary.orders ?? 0) > 0);

  ngOnInit(): void {
    this.selectPreset('today');
  }

  ngOnDestroy(): void {
    this.dailyChart?.destroy();
    this.hourChart?.destroy();
  }

  selectPreset(id: PresetId): void {
    this.preset.set(id);
    if (id === 'custom') return; // espera a que el usuario aplique las fechas

    const today = bogotaToday();
    const [y, m] = today.split('-').map(Number);
    const firstOfMonth = `${y}-${String(m).padStart(2, '0')}-01`;
    const ranges: Record<Exclude<PresetId, 'custom'>, [string, string]> = {
      today: [today, today],
      yesterday: [addDays(today, -1), addDays(today, -1)],
      '7d': [addDays(today, -6), today],
      '30d': [addDays(today, -29), today],
      month: [firstOfMonth, today],
      lastMonth: [
        `${m === 1 ? y - 1 : y}-${String(m === 1 ? 12 : m - 1).padStart(2, '0')}-01`,
        addDays(firstOfMonth, -1),
      ],
    };
    const [f, t] = ranges[id];
    this.load(f, t);
  }

  applyCustom(): void {
    if (!this.customFrom || !this.customTo) {
      this.error.set('Elige la fecha inicial y la final');
      return;
    }
    const [f, t] = this.customFrom <= this.customTo
      ? [this.customFrom, this.customTo]
      : [this.customTo, this.customFrom];
    this.load(f, t);
  }

  private load(from: string, to: string): void {
    this.from.set(from);
    this.to.set(to);
    this.customFrom = from;
    this.customTo = to;
    this.loading.set(true);
    this.error.set('');
    this.showAllProducts.set(false);
    this.svc.getReport(from, to).subscribe({
      next: r => {
        this.report.set(r);
        this.loading.set(false);
      },
      error: err => {
        this.error.set(err?.error?.message ?? 'No se pudo cargar el reporte');
        this.loading.set(false);
      },
    });
  }

  exportExcel(): void {
    this.exporting.set(true);
    this.svc.exportReport(this.from(), this.to()).subscribe({
      next: res => {
        this.saveBlob(res, `reporte-${this.from()}_${this.to()}.xlsx`);
        this.exporting.set(false);
      },
      error: () => {
        this.error.set('No se pudo generar el Excel');
        this.exporting.set(false);
      },
    });
  }

  // ── Presentación ───────────────────────────────────────────────

  /** Cambio porcentual vs el periodo anterior; null si no hay base para comparar. */
  delta(current: number, previous: number): number | null {
    if (!previous) return null;
    return Math.round(((current - previous) / previous) * 100);
  }

  sourceLabel(key: string): string { return SOURCE_LABELS[key] ?? key; }
  sourceColor(key: string): string { return SOURCE_COLORS[key] ?? '#6e7681'; }
  statusLabel(key: string): string { return STATUS_LABELS[key] ?? key; }

  barWidth(row: ReportGroupRow, rows: ReportGroupRow[], by: 'revenue' | 'orders' = 'revenue'): number {
    const max = Math.max(...rows.map(r => Number(r[by])));
    return max > 0 ? (Number(row[by]) / max) * 100 : 0;
  }

  share(row: ReportGroupRow, rows: ReportGroupRow[]): number {
    const total = rows.reduce((s, r) => s + Number(r.revenue), 0);
    return total > 0 ? Math.round((Number(row.revenue) / total) * 100) : 0;
  }

  longDate(iso: string): string {
    const d = new Date(iso + 'T12:00:00Z');
    return new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(d);
  }

  weekdayDate(iso: string): string {
    const d = new Date(iso + 'T12:00:00Z');
    return new Intl.DateTimeFormat('es-CO', { weekday: 'long', day: 'numeric', month: 'short', timeZone: 'UTC' }).format(d);
  }

  // ── Gráficas (una serie, un eje cada una) ─────────────────────

  private renderCharts(): void {
    const r = this.report();
    if (!r) return;
    this.dailyChart?.destroy();
    this.hourChart?.destroy();
    this.dailyChart = undefined;
    this.hourChart = undefined;

    if (this.dailyChartRef && !this.isSingleDay()) {
      this.dailyChart = new Chart(this.dailyChartRef.nativeElement, this.barConfig(
        r.daily.map(d => shortDate(d.date)),
        r.daily.map(d => Number(d.revenue)),
        'money',
        i => `${this.weekdayDate(r.daily[i].date)} · ${r.daily[i].orders} pedidos`,
      ));
    }

    if (this.hourChartRef && r.byHour.length) {
      const first = Math.min(...r.byHour.map(h => h.hour));
      const last = Math.max(...r.byHour.map(h => h.hour));
      const hours = Array.from({ length: last - first + 1 }, (_, i) => first + i);
      const byHour = new Map(r.byHour.map(h => [h.hour, h]));
      this.hourChart = new Chart(this.hourChartRef.nativeElement, this.barConfig(
        hours.map(h => `${String(h).padStart(2, '0')}:00`),
        hours.map(h => byHour.get(h)?.orders ?? 0),
        'count',
        i => {
          const row = byHour.get(hours[i]);
          return row ? `Ventas ${this.money(Number(row.revenue))}` : 'Sin pedidos';
        },
      ));
    }
  }

  private barConfig(labels: string[], values: number[], kind: 'money' | 'count',
                    footer: (index: number) => string): ChartConfiguration<'bar'> {
    const fmt = (v: number) => (kind === 'money' ? this.money(v) : `${v} pedidos`);
    return {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: SERIES_COLOR,
          hoverBackgroundColor: '#5c9df0',
          borderRadius: { topLeft: 4, topRight: 4 },
          borderSkipped: 'bottom',
          maxBarThickness: 36,
          categoryPercentage: 0.8,
          barPercentage: 0.9,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#0d1117',
            borderColor: '#30363d',
            borderWidth: 1,
            titleColor: '#e6edf3',
            bodyColor: '#e6edf3',
            footerColor: AXIS_INK,
            footerFont: { weight: 'normal' },
            padding: 10,
            displayColors: false,
            callbacks: {
              label: ctx => fmt(Number(ctx.raw)),
              footer: items => footer(items[0].dataIndex),
            },
          },
        },
        scales: {
          x: { ticks: { color: AXIS_INK, maxRotation: 0, autoSkipPadding: 8, font: { size: 11 } }, grid: { display: false }, border: { color: GRID } },
          y: {
            beginAtZero: true,
            border: { display: false },
            grid: { color: GRID },
            ticks: {
              color: AXIS_INK,
              font: { size: 11 },
              precision: 0,
              maxTicksLimit: 5,
              callback: v => (kind === 'money' ? this.compactMoney(Number(v)) : v),
            },
          },
        },
      },
    };
  }

  private money(v: number): string {
    return '$' + Math.round(v).toLocaleString('es-CO');
  }

  private compactMoney(v: number): string {
    if (v >= 1_000_000) return '$' + (v / 1_000_000).toLocaleString('es-CO', { maximumFractionDigits: 1 }) + ' M';
    if (v >= 1_000) return '$' + Math.round(v / 1_000) + ' mil';
    return '$' + v;
  }

  private saveBlob(response: HttpResponse<Blob>, fallbackName: string): void {
    if (!response.body) return;
    const disposition = response.headers.get('content-disposition') ?? '';
    const name = /filename="?(.*?)"?$/i.exec(disposition)?.[1] ?? fallbackName;
    const url = URL.createObjectURL(response.body);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
