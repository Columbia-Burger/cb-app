import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { DomicilioService } from '../services/domicilio.service';

export const domicilioAuthGuard: CanActivateFn = () => {
  const svc = inject(DomicilioService);
  const router = inject(Router);
  if (svc.isLoggedIn()) return true;
  return router.createUrlTree(['/domicilio/login']);
};
