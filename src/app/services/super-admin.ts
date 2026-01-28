import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SuperAdminService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/super-admin`;

  getTiendas() {
    return this.http.get<any[]>(`${this.apiUrl}/tiendas`);
  }

  crearTienda(datos: any) {
    return this.http.post(`${this.apiUrl}/crear`, datos, { responseType: 'text' });
  }
}