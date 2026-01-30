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
}