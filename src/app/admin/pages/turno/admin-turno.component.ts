import { Component, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe, DatePipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin.service';
import { ShiftResponse } from '../../models/admin.model';

type PageState = 'loading' | 'no-shift' | 'active' | 'closed-summary';

@Component({
  selector: 'app-admin-turno',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, NgClass, FormsModule],
  templateUrl: './admin-turno.component.html',
  styleUrl: './admin-turno.component.scss',
})
export class AdminTurnoComponent implements OnInit {
  private svc = inject(AdminService);

  state = signal<PageState>('loading');
  shift = signal<ShiftResponse | null>(null);
  error = signal('');

  initialCash = 0;
  finalCash = 0;
  opening = signal(false);
  closing = signal(false);

  ngOnInit(): void {
    this.loadCurrent();
  }

  loadCurrent(): void {
    this.state.set('loading');
    this.svc.getCurrentShift().subscribe({
      next: res => {
        if ('active' in res && !res.active) {
          this.state.set('no-shift');
          this.shift.set(null);
        } else {
          this.shift.set(res as ShiftResponse);
          this.state.set('active');
        }
      },
      error: () => this.state.set('no-shift'),
    });
  }

  openShift(): void {
    this.opening.set(true);
    this.error.set('');
    this.svc.openShift(this.initialCash).subscribe({
      next: res => {
        this.shift.set(res);
        this.state.set('active');
        this.opening.set(false);
      },
      error: err => {
        this.error.set(err?.error?.message ?? 'Error al abrir el turno');
        this.opening.set(false);
      },
    });
  }

  closeShift(): void {
    this.closing.set(true);
    this.error.set('');
    this.svc.closeShift(this.finalCash).subscribe({
      next: res => {
        this.shift.set(res);
        this.state.set('closed-summary');
        this.closing.set(false);
      },
      error: err => {
        this.error.set(err?.error?.message ?? 'Error al cerrar el turno');
        this.closing.set(false);
      },
    });
  }

  newShift(): void {
    this.initialCash = 0;
    this.finalCash = 0;
    this.state.set('no-shift');
    this.shift.set(null);
  }

  printSummary(): void {
    window.print();
  }

  differenceLabel(): string {
    const d = this.shift()?.difference;
    if (d == null) return '';
    if (d > 0) return `Sobran $${d.toLocaleString('es-CO')}`;
    if (d < 0) return `Faltan $${Math.abs(d).toLocaleString('es-CO')}`;
    return 'Cuadra exacto';
  }

  differenceClass(): string {
    const d = this.shift()?.difference;
    if (d == null) return '';
    if (d > 0) return 'positive';
    if (d < 0) return 'negative';
    return 'exact';
  }
}
