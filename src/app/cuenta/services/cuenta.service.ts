import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface CustomerProfile {
  id: number;
  name: string;
  whatsapp: string;
  neighborhood: string;
  address: string;
  createdAt: string;
}

export interface OrderItem {
  id: number;
  productName: string;
  flavor: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  note: string;
}

export interface CustomerOrder {
  id: number;
  status: string;
  total: number;
  deliveryFee: number;
  deliveryZone: string;
  notes: string;
  source: string;
  createdAt: string;
  items: OrderItem[];
}

@Injectable({ providedIn: 'root' })
export class CuentaService {
  private http = inject(HttpClient);
  private base = environment.businessApiUrl;
  private readonly TOKEN_KEY = 'cb_customer_token';

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  private authHeaders(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.getToken()}` });
  }

  sendOtp(whatsapp: string): Observable<void> {
    return this.http.post<void>(`${this.base}/api/auth/otp/send`, { whatsapp });
  }

  verifyOtp(whatsapp: string, code: string): Observable<{ token: string }> {
    return this.http.post<{ token: string }>(`${this.base}/api/auth/otp/verify`, { whatsapp, code }).pipe(
      tap(res => localStorage.setItem(this.TOKEN_KEY, res.token))
    );
  }

  getProfile(): Observable<CustomerProfile> {
    return this.http.get<CustomerProfile>(`${this.base}/api/customers/me`, {
      headers: this.authHeaders()
    });
  }

  getOrders(): Observable<CustomerOrder[]> {
    return this.http.get<CustomerOrder[]>(`${this.base}/api/customers/me/orders`, {
      headers: this.authHeaders()
    });
  }
}
