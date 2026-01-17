import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { Loader } from '../services/loader';

export const loaderInterceptor: HttpInterceptorFn = (req, next) => {
  const loaderService = inject(Loader);
  
  // 1. Mostrar spinner al iniciar petición
  loaderService.show();

  return next(req).pipe(
    // 2. Ocultar spinner cuando termine (ya sea éxito o error)
    finalize(() => loaderService.hide())
  );
};