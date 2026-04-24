import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OrdenService {
  
  private http = inject(HttpClient);
  // Asegúrate de que tu environment tenga la URL base (ej: http://localhost:8080/api)
  private apiUrl = environment.apiUrl + '/ordenes'; 

  constructor() { }

  /**
   * Envía el carrito al backend para crear la reserva
   * @param request Objeto con la lista de detalles
   */
  crearOrden(request: any) {
    return this.http.post(`${this.apiUrl}/crear`, request);
  }

  /**
   * Obtiene el historial de compras del usuario logueado
   */
  getMisOrdenes() {
    return this.http.get<any[]>(`${this.apiUrl}/mis-ordenes`);
  }

  /**
   * (Opcional) Para pagar una orden específica
   */
  pagarOrden(idOrden: number) {
    return this.http.post(`${this.apiUrl}/${idOrden}/pagar`, {});
  }

  getOrdenById(id: number) {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  informarPago(id: number, archivo: File) {
    const formData = new FormData();
    formData.append('archivo', archivo);
    return this.http.post(`${this.apiUrl}/${id}/informar-pago`, formData);
  }

  abrirCaja(detalleId: number) {
    return this.http.post<{premio: string}>(`${this.apiUrl}/detalle/${detalleId}/abrir-caja`, {});
  }

  // --- ADMIN ---
  getPendientesValidacion() {
    return this.http.get<any[]>(`${environment.apiUrl}/admin/ordenes/pendientes-validacion`);
  }

  aprobarPago(id: number) {
    return this.http.post(`${environment.apiUrl}/admin/ordenes/${id}/aprobar`, {});
  }

  rechazarPago(id: number, motivo: string = '') {
    return this.http.post(`${environment.apiUrl}/admin/ordenes/${id}/rechazar?motivo=${encodeURIComponent(motivo)}`, {});
  }

  cancelarOrden(id: number) {
    return this.http.delete<any>(`${this.apiUrl}/${id}/cancelar`);
  }
}
