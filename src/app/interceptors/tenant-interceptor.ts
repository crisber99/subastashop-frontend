import { HttpInterceptorFn } from '@angular/common/http';

export const tenantInterceptor: HttpInterceptorFn = (req, next) => {
  // No agregar header de tenant a APIs externas
  if (req.url.includes('nominatim.openstreetmap.org')) {
    return next(req);
  }

  // Lógica para detectar el tenant
  let tenantId = 'tienda'; // Valor que coincide con la data existente en el backend

  // Ejemplo de lógica real futura:
  // const host = window.location.host; // ej: juguetes.midominio.com
  // tenantId = host.split('.')[0]; 

  // Clonamos la petición y le agregamos el header
  const authReq = req.clone({
    headers: req.headers.set('X-Tenant-ID', tenantId)
  });

  return next(authReq);
};
