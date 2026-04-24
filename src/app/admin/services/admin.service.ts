import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  LoginRequest, LoginResponse, OrderResponse, OrderStatus,
  CustomerResponse, DashboardStats, TopProduct,
  CreateOrderRequest, CatalogProduct, FlavorItem, AdditionItem, ShiftResponse, DailyStatResponse,
  SourceStatResponse, HourlyStatResponse, CategoryItem, CreateProductRequest
} from '../models/admin.model';
import { ProductResponse } from '../../models/api.model';

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
    const payload = this.getPayload();
    return payload?.role === 'ADMIN' && !this.isTokenExpired(payload);
  }

  getRole(): string | null {
    return this.getPayload()?.role ?? null;
  }

  private getPayload(): { role?: string; exp?: number } | null {
    try {
      const token = this.getToken();
      if (!token) return null;
      return JSON.parse(atob(token.split('.')[1]));
    } catch {
      return null;
    }
  }

  private isTokenExpired(payload: { exp?: number }): boolean {
    if (!payload.exp) return true;
    return payload.exp * 1000 <= Date.now();
  }

  private authHeaders(): HttpHeaders {
    const token = this.getToken();
    if (!token) {
      return new HttpHeaders();
    }
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
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

  getDailyStats(days = 7): Observable<DailyStatResponse[]> {
    return this.http.get<DailyStatResponse[]>(`${this.base}/api/admin/stats/daily?days=${days}`, {
      headers: this.authHeaders()
    });
  }

  getStatsBySource(): Observable<SourceStatResponse[]> {
    return this.http.get<SourceStatResponse[]>(`${this.base}/api/admin/stats/by-source`, {
      headers: this.authHeaders()
    });
  }

  getStatsByHour(): Observable<HourlyStatResponse[]> {
    return this.http.get<HourlyStatResponse[]>(`${this.base}/api/admin/stats/by-hour`, {
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
    return this.http.get<ProductResponse[]>(`${environment.apiUrl}/api/products?availableOnly=true`).pipe(
      map(products => products.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        imageUrl: p.imageUrl,
        available: p.available,
        categoryId: p.categoryId,
        categoryName: p.categoryName,
        ...(p.flavors?.length ? { flavors: p.flavors.map(f => ({ id: f.id, name: f.name })) } : {}),
        ...(p.additions?.length ? { additions: p.additions.map(a => ({
          id: a.id,
          additionId: a.additionId,
          name: a.additionName,
          effectivePrice: a.effectivePrice
        })) } : {}),
      })))
    );
  }

  getFlavors(): Observable<FlavorItem[]> {
    return this.http.get<FlavorItem[]>(`${this.base}/api/admin/catalog/flavors`, {
      headers: this.authHeaders()
    });
  }

  updateProductFlavors(productId: number, flavorIds: number[]): Observable<void> {
    return this.http.patch<void>(
      `${this.base}/api/admin/catalog/products/${productId}/flavors`,
      flavorIds,
      { headers: this.authHeaders() }
    );
  }

  getAdminProducts(): Observable<CatalogProduct[]> {
    return this.http.get<CatalogProduct[]>(`${this.base}/api/admin/catalog/products`, {
      headers: this.authHeaders()
    });
  }

  toggleProduct(id: number): Observable<void> {
    return this.http.patch<void>(`${this.base}/api/admin/catalog/products/${id}/toggle`, null, {
      headers: this.authHeaders()
    });
  }

  getCategories(): Observable<CategoryItem[]> {
    return this.http.get<CategoryItem[]>(`${this.base}/api/admin/catalog/categories`, {
      headers: this.authHeaders()
    });
  }

  createProduct(request: CreateProductRequest): Observable<CatalogProduct> {
    return this.http.post<CatalogProduct>(`${this.base}/api/admin/catalog/products`, request, {
      headers: this.authHeaders()
    });
  }

  // ── Crear pedido ─────────────────────────────────────────────
  getAdditions(): Observable<AdditionItem[]> {
    return this.http.get<AdditionItem[]>(`${this.base}/api/admin/catalog/additions`, {
      headers: this.authHeaders()
    });
  }

  updateProductAdditions(productId: number, additionIds: number[]): Observable<void> {
    return this.http.patch<void>(
      `${this.base}/api/admin/catalog/products/${productId}/additions`,
      additionIds,
      { headers: this.authHeaders() }
    );
  }

  createOrder(request: CreateOrderRequest): Observable<OrderResponse> {
    return this.http.post<OrderResponse>(`${this.base}/api/orders`, request, {
      headers: this.authHeaders()
    });
  }
}
