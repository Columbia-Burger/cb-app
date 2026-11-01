import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin.service';
import { CustomerResponse } from '../../models/admin.model';

@Component({
    selector: 'app-admin-clientes',
    imports: [DatePipe, FormsModule],
    templateUrl: './admin-clientes.component.html',
    styleUrl: './admin-clientes.component.scss'
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
      (c.neighborhood ?? '').toLowerCase().includes(q) ||
      (c.address ?? '').toLowerCase().includes(q)
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
