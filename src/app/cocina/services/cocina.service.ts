import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, forkJoin, map, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { OrderResponse, OrderStatus, LoginRequest, LoginResponse } from '../../admin/models/admin.model';

@Injectable({ providedIn: 'root' })
export class CocinaService {
  private http = inject(HttpClient);
  private base = environment.businessApiUrl;
  private readonly TOKEN_KEY = 'cb_kitchen_token';

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
    return this.getRole() === 'KITCHEN';
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

  getKitchenOrders(): Observable<OrderResponse[]> {
    const headers = this.authHeaders();
    return forkJoin([
      this.http.get<OrderResponse[]>(`${this.base}/api/orders?status=RECEIVED`, { headers }),
      this.http.get<OrderResponse[]>(`${this.base}/api/orders?status=PREPARING`, { headers })
    ]).pipe(
      map(([received, preparing]) =>
        [...received, ...preparing].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      )
    );
  }

  updateOrderStatus(id: number, status: OrderStatus): Observable<OrderResponse> {
    return this.http.patch<OrderResponse>(
      `${this.base}/api/orders/${id}/status`,
      { status },
      { headers: this.authHeaders() }
    );
  }
}
