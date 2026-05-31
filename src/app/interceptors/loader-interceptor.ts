import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize, timeout } from 'rxjs';
import { Loader } from '../services/loader';

export const loaderInterceptor: HttpInterceptorFn = (req, next) => {
  const loaderService = inject(Loader);
  
  // Evitar mostrar el loader global para la suscripción de pre-lanzamiento
  // porque el componente LandingTeaser ya tiene su propio spinner en el botón
  if (req.url.includes('/prelaunch/subscribe')) {
    return next(req);
  }

  // 1. Mostrar spinner al iniciar petición
  loaderService.show();

  return next(req).pipe(
    // Añadimos un timeout de 30 segundos para evitar que la app se quede pegada si el servidor no responde
    timeout(30000),
    // 2. Ocultar spinner cuando termine (ya sea éxito o error)
    finalize(() => loaderService.hide())
  );
};
