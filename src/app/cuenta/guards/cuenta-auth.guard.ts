import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { CuentaService } from '../services/cuenta.service';

export const cuentaAuthGuard: CanActivateFn = () => {
  const cuentaService = inject(CuentaService);
  const router = inject(Router);
  if (cuentaService.isLoggedIn()) return true;
  return router.createUrlTree(['/cuenta/login']);
};
