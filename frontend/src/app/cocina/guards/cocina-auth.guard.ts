import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { CocinaService } from '../services/cocina.service';

export const cocinaAuthGuard: CanActivateFn = () => {
  const svc = inject(CocinaService);
  const router = inject(Router);
  if (svc.isLoggedIn()) return true;
  return router.createUrlTree(['/cocina/login']);
};
