import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  LoginRequest, LoginResponse, OrderResponse, OrderStatus,
  CustomerResponse, DashboardStats, TopProduct,
  CreateOrderRequest, CatalogProduct, ShiftResponse
} from '../models/admin.model';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);
  private base = environment.businessApiUrl;

  private readonly TOKEN_KEY = 'cb_admin_token';

  // ── Auth ────────────────────────────────────────────────────
  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.base}/api/auth/login`, request).pipe(
      tap(res => localStorage.setItem(this.TOKEN_KEY, res.token))
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  private authHeaders(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.getToken()}` });
  }

  // ── Dashboard ────────────────────────────────────────────────
  getStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.base}/api/admin/stats`, {
      headers: this.authHeaders()
    });
  }

  getTopProducts(limit = 10): Observable<TopProduct[]> {
    return this.http.get<TopProduct[]>(`${this.base}/api/admin/products/top?limit=${limit}`, {
      headers: this.authHeaders()
    });
  }

  // ── Pedidos ──────────────────────────────────────────────────
  getOrders(status?: OrderStatus, from?: string): Observable<OrderResponse[]> {
    let url = `${this.base}/api/orders`;
    const params: string[] = [];
    if (status) params.push(`status=${status}`);
    if (from) params.push(`from=${encodeURIComponent(from)}`);
    if (params.length) url += '?' + params.join('&');
    return this.http.get<OrderResponse[]>(url, { headers: this.authHeaders() });
  }

  // ── Turnos ───────────────────────────────────────────────────
  getCurrentShift(): Observable<ShiftResponse | { active: false }> {
    return this.http.get<ShiftResponse | { active: false }>(
      `${this.base}/api/admin/shifts/current`,
      { headers: this.authHeaders() }
    );
  }

  openShift(): Observable<ShiftResponse> {
    return this.http.post<ShiftResponse>(`${this.base}/api/shifts/open`, {});
  }

  closeShift(): Observable<ShiftResponse> {
    return this.http.post<ShiftResponse>(`${this.base}/api/shifts/close`, {});
  }

  updateOrderStatus(id: number, status: OrderStatus): Observable<OrderResponse> {
    return this.http.patch<OrderResponse>(
      `${this.base}/api/orders/${id}/status`,
      { status },
      { headers: this.authHeaders() }
    );
  }

  // ── Clientes ─────────────────────────────────────────────────
  getCustomers(): Observable<CustomerResponse[]> {
    return this.http.get<CustomerResponse[]>(`${this.base}/api/customers`, {
      headers: this.authHeaders()
    });
  }

  // ── Menú (catálogo) ──────────────────────────────────────────
  getMenu(): Observable<CatalogProduct[]> {
    return this.http.get<CatalogProduct[]>(`${environment.apiUrl}/api/products?availableOnly=true`);
  }

  // ── Crear pedido ─────────────────────────────────────────────
  createOrder(request: CreateOrderRequest): Observable<OrderResponse> {
    return this.http.post<OrderResponse>(`${this.base}/api/orders`, request, {
      headers: this.authHeaders()
    });
  }
}
