import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth-service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  console.log('🛑 INTERCEPTOR EJECUTÁNDOSE. Token:', token ? 'SI TIENE' : 'NO TIENE', 'URL:', req.url);
  
  // Si es una petición de login o registro, no enviamos el token (aunque exista uno viejo)
  if (req.url.includes('/auth/')) {
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