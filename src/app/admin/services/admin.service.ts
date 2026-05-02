import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  LoginRequest, LoginResponse, OrderResponse, OrderStatus,
  CustomerResponse, DashboardStats, TopProduct,
  CreateOrderRequest, UpdateOrderRequest, CatalogProduct, FlavorItem, AdditionItem, ShiftResponse, DailyStatResponse,
  SourceStatResponse, HourlyStatResponse, CategoryItem, CreateProductRequest, CreateAdditionRequest,
  DeliveryZone, CreateDeliveryZoneRequest, SocialPost, GeneratePostRequest, UpdatePostRequest, PostStatus
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

  updateOrder(id: number, request: UpdateOrderRequest): Observable<OrderResponse> {
    return this.http.put<OrderResponse>(`${this.base}/api/orders/${id}`, request, {
      headers: this.authHeaders()
    });
  }

  // ── Facturas ─────────────────────────────────────────────────
  getInvoices(): Observable<OrderResponse[]> {
    return this.http.get<OrderResponse[]>(`${this.base}/api/invoices`, {
      headers: this.authHeaders()
    });
  }

  generateInvoice(orderId: number): Observable<OrderResponse> {
    return this.http.post<OrderResponse>(`${this.base}/api/invoices/${orderId}/generate`, null, {
      headers: this.authHeaders()
    });
  }

  voidInvoice(orderId: number): Observable<OrderResponse> {
    return this.http.patch<OrderResponse>(`${this.base}/api/invoices/${orderId}/void`, null, {
      headers: this.authHeaders()
    });
  }

  generateElectronicInvoice(orderId: number, req: import('../models/admin.model').ElectronicInvoiceRequest): Observable<import('../models/admin.model').ElectronicInvoiceResponse> {
    return this.http.post<import('../models/admin.model').ElectronicInvoiceResponse>(
      `${this.base}/api/invoices/${orderId}/electronic`, req, { headers: this.authHeaders() }
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
        ...(p.comboDescription ? { comboDescription: p.comboDescription, comboPrice: p.comboPrice ?? 0 } : {}),
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

  setProductCombo(productId: number, request: { description: string; price: number }): Observable<void> {
    return this.http.patch<void>(`${this.base}/api/admin/catalog/products/${productId}/combo`, request, {
      headers: this.authHeaders()
    });
  }

  clearProductCombo(productId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/api/admin/catalog/products/${productId}/combo`, {
      headers: this.authHeaders()
    });
  }

  createAddition(request: CreateAdditionRequest): Observable<AdditionItem> {
    return this.http.post<AdditionItem>(`${this.base}/api/admin/catalog/additions`, request, {
      headers: this.authHeaders()
    });
  }

  updateAddition(id: number, request: CreateAdditionRequest): Observable<AdditionItem> {
    return this.http.put<AdditionItem>(`${this.base}/api/admin/catalog/additions/${id}`, request, {
      headers: this.authHeaders()
    });
  }

  toggleAdditionActive(id: number): Observable<void> {
    return this.http.patch<void>(`${this.base}/api/admin/catalog/additions/${id}/toggle-active`, null, {
      headers: this.authHeaders()
    });
  }

  // ── Zonas de domicilio ────────────────────────────────────────
  getDeliveryZones(activeOnly = false): Observable<DeliveryZone[]> {
    return this.http.get<DeliveryZone[]>(
      `${this.base}/api/admin/catalog/delivery-zones?activeOnly=${activeOnly}`,
      { headers: this.authHeaders() }
    );
  }

  createDeliveryZone(request: CreateDeliveryZoneRequest): Observable<DeliveryZone> {
    return this.http.post<DeliveryZone>(`${this.base}/api/admin/catalog/delivery-zones`, request, {
      headers: this.authHeaders()
    });
  }

  updateDeliveryZone(id: number, request: CreateDeliveryZoneRequest): Observable<DeliveryZone> {
    return this.http.put<DeliveryZone>(`${this.base}/api/admin/catalog/delivery-zones/${id}`, request, {
      headers: this.authHeaders()
    });
  }

  toggleDeliveryZoneActive(id: number): Observable<void> {
    return this.http.patch<void>(
      `${this.base}/api/admin/catalog/delivery-zones/${id}/toggle-active`, null,
      { headers: this.authHeaders() }
    );
  }

  // ── Social Media ─────────────────────────────────────────────
  generatePost(request: GeneratePostRequest): Observable<SocialPost> {
    return this.http.post<SocialPost>(`${this.base}/api/social/generate`, request, { headers: this.authHeaders() });
  }

  getSocialPosts(status?: PostStatus): Observable<SocialPost[]> {
    const url = status ? `${this.base}/api/social/posts?status=${status}` : `${this.base}/api/social/posts`;
    return this.http.get<SocialPost[]>(url, { headers: this.authHeaders() });
  }

  updateSocialPost(id: number, request: UpdatePostRequest): Observable<SocialPost> {
    return this.http.put<SocialPost>(`${this.base}/api/social/posts/${id}`, request, { headers: this.authHeaders() });
  }

  deleteSocialPost(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/api/social/posts/${id}`, { headers: this.authHeaders() });
  }

  publishSocialPost(id: number): Observable<SocialPost> {
    return this.http.post<SocialPost>(`${this.base}/api/social/posts/${id}/publish`, {}, { headers: this.authHeaders() });
  }

  // ── Cupones ──────────────────────────────────────────────────
  getCoupons(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/api/coupons`, { headers: this.authHeaders() });
  }

  createCoupon(body: any): Observable<any> {
    return this.http.post<any>(`${this.base}/api/coupons`, body, { headers: this.authHeaders() });
  }

  toggleCoupon(id: number): Observable<any> {
    return this.http.patch<any>(`${this.base}/api/coupons/${id}/toggle`, {}, { headers: this.authHeaders() });
  }

  deleteCoupon(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/api/coupons/${id}`, { headers: this.authHeaders() });
  }
}
