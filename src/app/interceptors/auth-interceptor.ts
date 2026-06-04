import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth-service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  //console.log('🛑 INTERCEPTOR EJECUTÁNDOSE. Token:', token ? 'SI TIENE' : 'NO TIENE', 'URL:', req.url);

  // Si es login, registro o una API externa como Nominatim, no enviamos el token
  if (req.url.includes('/auth/login') || req.url.includes('/auth/register') || req.url.includes('nominatim.openstreetmap.org')) {
    return next(req);
  }

  // Si tenemos token, clonamos la petición y lo agregamos
  if (token) {
    const authReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
    return next(authReq);
  }

  // Si no hay token, pasa la petición tal cual
  return next(req);
};
