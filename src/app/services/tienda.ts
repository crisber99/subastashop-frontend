import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
@Injectable({
  providedIn: 'root',
})
export class TiendaService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/tiendas`; // Apunta a /api/tiendas

  // 1. Obtener los datos actuales de mi tienda
  getMiTienda(): Observable<any> {
    return this.http.get(`${this.apiUrl}/mi-tienda`);
  }

  // 2. Actualizar configuración (Usa FormData porque enviamos FOTOS)
  actualizarConfiguracion(formData: FormData): Observable<any> {
    return this.http.put(`${this.apiUrl}/mi-tienda/configuracion`, formData);
  }
}