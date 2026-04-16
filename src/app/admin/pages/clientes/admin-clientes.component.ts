import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin.service';
import { CustomerResponse } from '../../models/admin.model';

@Component({
  selector: 'app-admin-clientes',
  standalone: true,
  imports: [DatePipe, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h2 class="page-title">Clientes</h2>
        <span class="total-badge">{{ filtered().length }} clientes</span>
      </div>

      <div class="search-bar">
        <input
          type="text"
          placeholder="Buscar por nombre, WhatsApp o barrio..."
          [(ngModel)]="search"
        />
      </div>

      @if (loading()) {
        <div class="loading">Cargando clientes...</div>
      } @else {
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Nombre</th>
                <th>WhatsApp</th>
                <th>Barrio</th>
                <th>Registrado</th>
              </tr>
            </thead>
            <tbody>
              @for (c of filtered(); track c.id) {
                <tr>
                  <td class="id-cell">{{ c.id }}</td>
                  <td class="name-cell">{{ c.name }}</td>
                  <td>
                    <a
                      class="whatsapp-link"
                      [href]="'https://wa.me/' + c.whatsapp"
                      target="_blank">
                      {{ c.whatsapp }}
                    </a>
                  </td>
                  <td>{{ c.neighborhood || '—' }}</td>
                  <td class="date-cell">{{ c.createdAt | date:'dd/MM/yyyy' }}</td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="5" class="empty">No se encontraron clientes.</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
  styles: [`
    .page { color: #c9d1d9; }
    .page-header {
      display: flex;
      align-items: center;
      gap: 1em;
      margin-bottom: 1.25em;
    }
    .page-title { font-size: 1.5em; font-weight: 700; color: #e6edf3; margin: 0; }
    .total-badge {
      background: #21262d;
      color: #8b949e;
      font-size: 0.8em;
      padding: 0.25em 0.6em;
      border-radius: 20px;
    }
    .search-bar {
      margin-bottom: 1.25em;
    }
    .search-bar input {
      width: 100%;
      max-width: 400px;
      padding: 0.65em 1em;
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 8px;
      color: #c9d1d9;
      font-size: 0.9em;
      box-sizing: border-box;
    }
    .search-bar input:focus {
      outline: none;
      border-color: #e94560;
    }
    .loading { color: #8b949e; }
    .table-wrapper {
      background: #161b22;
      border: 1px solid #21262d;
      border-radius: 12px;
      overflow: hidden;
    }
    table { width: 100%; border-collapse: collapse; }
    thead tr { background: #0d1117; }
    th {
      padding: 0.75em 1em;
      text-align: left;
      font-size: 0.78em;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #8b949e;
      border-bottom: 1px solid #21262d;
    }
    td {
      padding: 0.75em 1em;
      font-size: 0.9em;
      border-bottom: 1px solid #21262d;
    }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: rgba(255,255,255,0.02); }
    .id-cell { color: #8b949e; }
    .name-cell { font-weight: 500; color: #e6edf3; }
    .date-cell { color: #8b949e; font-size: 0.82em; }
    .whatsapp-link {
      color: #3fb950;
      text-decoration: none;
    }
    .whatsapp-link:hover { text-decoration: underline; }
    .empty {
      text-align: center;
      color: #8b949e;
      padding: 2em !important;
    }
  `]
})
export class AdminClientesComponent implements OnInit {
  private adminService = inject(AdminService);

  loading = signal(true);
  customers = signal<CustomerResponse[]>([]);
  search = '';

  filtered = computed(() => {
    const q = this.search.toLowerCase();
    return this.customers().filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.whatsapp.includes(q) ||
      (c.neighborhood ?? '').toLowerCase().includes(q)
    );
  });

  ngOnInit(): void {
    this.adminService.getCustomers().subscribe({
      next: data => {
        this.customers.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}
