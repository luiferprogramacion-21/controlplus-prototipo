import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';
import { PrototypeStateService } from './prototype-state.service';

export const sessionGuard: CanActivateChildFn = () => inject(PrototypeStateService).user() ? true : inject(Router).parseUrl('/ingresar');

export const saleGuard: CanActivateFn = () => {
  const state = inject(PrototypeStateService);
  const router = inject(Router);
  if (!state.cashOpen()) return router.parseUrl('/operacion/caja/apertura');
  if (state.completedSale()) return router.parseUrl('/operacion/ventas/confirmada');
  return true;
};

export const checkoutGuard: CanActivateFn = () => inject(PrototypeStateService).cart().length > 0 ? true : inject(Router).parseUrl('/operacion/ventas/nueva');
export const confirmationGuard: CanActivateFn = () => inject(PrototypeStateService).completedSale() ? true : inject(Router).parseUrl('/operacion/ventas/nueva');
