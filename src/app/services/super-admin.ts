import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SuperAdminService {
  private http = inject(HttpClient);
  private apiUrlSuperAdmin = `${environment.apiUrl}/super-admin`;
  private apiUrlReporte = `${environment.apiUrl}/reportes`;

  getTiendas() {
    return this.http.get<any[]>(`${this.apiUrlSuperAdmin}/tiendas`);
  }

  crearTienda(datos: any) {
    return this.http.post(`${this.apiUrlSuperAdmin}/crear`, datos, { responseType: 'text' });
  }

  getReportesPendientes() {
    return this.http.get<any[]>(`${this.apiUrlReporte}/admin/pendientes`);
  }

  gestionarReporte(reporteId: number, accion: string) {
    return this.http.post(`${this.apiUrlReporte}/admin/accion/${reporteId}?accion=${accion}`, {});
  }

  reportarProducto(productoId: number, motivo: string) {
    const body = { motivo: motivo };
    return this.http.post(`${environment.apiUrl}/reportes/${productoId}`, body);
  }
}