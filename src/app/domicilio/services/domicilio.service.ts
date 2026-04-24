import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { OrderResponse, OrderStatus, LoginRequest, LoginResponse, CatalogProduct, CreateOrderRequest, DeliveryZone } from '../../admin/models/admin.model';
import { ProductResponse } from '../../models/api.model';

@Injectable({ providedIn: 'root' })
export class DomicilioService {
  private http = inject(HttpClient);
  private base = environment.businessApiUrl;
  private readonly TOKEN_KEY = 'cb_delivery_token';

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
    return this.getRole() === 'DELIVERY';
  }

  getRole(): string | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.role ?? null;
    } catch { return null; }
  }

  private authHeaders(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.getToken()}` });
  }

  getDeliveryOrders(): Observable<OrderResponse[]> {
    return this.http.get<OrderResponse[]>(`${this.base}/api/orders/delivery`, {
      headers: this.authHeaders()
    });
  }

  updateOrderStatus(id: number, status: OrderStatus): Observable<OrderResponse> {
    return this.http.patch<OrderResponse>(
      `${this.base}/api/orders/${id}/status`,
      { status },
      { headers: this.authHeaders() }
    );
  }

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
          id: a.id, additionId: a.additionId, name: a.additionName, effectivePrice: a.effectivePrice
        })) } : {}),
        ...(p.comboDescription ? { comboDescription: p.comboDescription, comboPrice: p.comboPrice ?? 0 } : {}),
      })))
    );
  }

  getDeliveryZones(): Observable<DeliveryZone[]> {
    return this.http.get<DeliveryZone[]>(
      `${this.base}/api/admin/catalog/delivery-zones?activeOnly=true`,
      { headers: this.authHeaders() }
    );
  }

  createOrder(request: CreateOrderRequest): Observable<OrderResponse> {
    return this.http.post<OrderResponse>(`${this.base}/api/orders`, request, {
      headers: this.authHeaders()
    });
  }
}
