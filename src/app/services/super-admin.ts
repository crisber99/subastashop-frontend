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

  getUsuarios() {
    return this.http.get<any[]>(`${this.apiUrlSuperAdmin}`);
  }

  cambiarRol(userId: number, nuevoRol: string) {
    return this.http.put(`${this.apiUrlSuperAdmin}/${userId}/rol`, { rol: nuevoRol }, { responseType: 'text' });
  }

  eliminarUsuario(userId: number) {
    return this.http.delete(`${this.apiUrlSuperAdmin}/${userId}`);
  }

  actualizarUsuario(userId: number, datos: any) {
    return this.http.put(`${this.apiUrlSuperAdmin}/${userId}`, datos);
  }

  getStats() {
    return this.http.get<any>(`${this.apiUrlSuperAdmin}/stats`);
  }
}