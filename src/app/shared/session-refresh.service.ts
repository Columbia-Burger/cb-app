import { Injectable, NgZone, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { SESSION_AREAS, hasValidSession, readTokenPayload } from './session';

/** Renueva un token cuando tiene más de esta antigüedad. */
const REFRESH_AFTER_MS = 30 * 60 * 1000;
const CHECK_EVERY_MS = 10 * 60 * 1000;

/**
 * Mantiene viva la sesión del personal mientras usa la app: el token se renueva en segundo plano,
 * así que solo se pide iniciar sesión tras varios días sin abrirla (JWT_EXPIRATION_MS).
 */
@Injectable({ providedIn: 'root' })
export class SessionRefreshService {
  private http = inject(HttpClient);
  private zone = inject(NgZone);
  private inFlight = new Set<string>();
  private started = false;

  start(): void {
    if (this.started) return;
    this.started = true;

    this.refreshDueTokens();
    // Al volver a la app (p. ej. desde el ícono de inicio) es cuando más importa renovar
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') this.refreshDueTokens();
    });
    // Fuera de la zona de Angular para no disparar detección de cambios cada vez
    this.zone.runOutsideAngular(() => setInterval(() => this.refreshDueTokens(), CHECK_EVERY_MS));
  }

  private refreshDueTokens(): void {
    for (const area of SESSION_AREAS) {
      if (!area.autoRefresh || this.inFlight.has(area.tokenKey)) continue;
      if (!hasValidSession(area.tokenKey, area.roles)) continue;

      const token = localStorage.getItem(area.tokenKey)!;
      const issuedAt = (readTokenPayload(token)?.iat ?? 0) * 1000;
      if (Date.now() - issuedAt < REFRESH_AFTER_MS) continue;

      this.inFlight.add(area.tokenKey);
      this.http.post<{ token: string }>(`${environment.businessApiUrl}/api/auth/refresh`, null, {
        headers: new HttpHeaders({ Authorization: `Bearer ${token}` }),
      }).subscribe({
        next: res => {
          // Solo reemplazar si la sesión no cambió mientras tanto (logout o login con otro usuario)
          if (localStorage.getItem(area.tokenKey) === token) {
            localStorage.setItem(area.tokenKey, res.token);
          }
          this.inFlight.delete(area.tokenKey);
        },
        // Si falla, la siguiente llamada con 401 lleva al login
        error: () => this.inFlight.delete(area.tokenKey),
      });
    }
  }
}
