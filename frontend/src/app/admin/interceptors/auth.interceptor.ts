import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AdminService } from '../services/admin.service';
import { environment } from '../../../environments/environment';
import { areaForUrl } from '../../shared/session';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const adminService = inject(AdminService);

  // Con businessApiUrl vacío (mismo dominio) el prefijo queda en '/api/'; nunca toca peticiones externas
  const isBusinessApi = req.url.startsWith(`${environment.businessApiUrl}/api/`);
  // Login, OTP y renovación manejan sus propios errores
  const isAuthCall = req.url.startsWith(`${environment.businessApiUrl}/api/auth/`);

  let authReq = req;
  if (isBusinessApi && !req.headers.has('Authorization')) {
    const token = adminService.getToken();
    if (token) {
      authReq = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
    }
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // 401 = el servidor ya no acepta el token (vencido, inválido o firmado con otra clave).
      // Antes solo se redirigía si el token parecía vencido en el dispositivo, y en cocina/domicilio
      // nunca: la pantalla quedaba abierta sin cargar datos.
      if (isBusinessApi && !isAuthCall && error.status === 401) {
        const area = areaForUrl(router.url);
        if (area) {
          localStorage.removeItem(area.tokenKey);
          router.navigate([area.loginPath], { queryParams: { expired: 1 } });
        }
      }
      return throwError(() => error);
    })
  );
};
