import { HttpInterceptorFn } from '@angular/common/http';

export const tenantInterceptor: HttpInterceptorFn = (req, next) => {
  // Lógica para detectar el tenant
  let tenantId = 'tienda-demo'; // Valor por defecto para desarrollo local

  // Ejemplo de lógica real futura:
  // const host = window.location.host; // ej: juguetes.midominio.com
  // tenantId = host.split('.')[0]; 

  // Clonamos la petición y le agregamos el header
  const authReq = req.clone({
    headers: req.headers.set('X-Tenant-ID', tenantId)
  });

  return next(authReq);
};