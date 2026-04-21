import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AdminService } from '../services/admin.service';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const adminService = inject(AdminService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const isBusinessApi = req.url.startsWith(environment.businessApiUrl);
      if (isBusinessApi && (error.status === 401 || error.status === 403)) {
        adminService.logout();
        router.navigate(['/admin/login']);
      }
      return throwError(() => error);
    })
  );
};
