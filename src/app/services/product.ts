import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private http = inject(HttpClient);
  private apiUrlProductos = `${environment.apiUrl}/productos`;
  private apiUrlSubastas = `${environment.apiUrl}/subastas`;
  private apiUrlUsuario = `${environment.apiUrl}/usuario`;
  private apiUrlOrdenes = `${environment.apiUrl}/ordenes`;

  getProductos(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrlProductos);
  }

  getProductoById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrlProductos}/${id}`);
  }

  // Enviar una puja
  realizarPuja(productoId: number, monto: number): Observable<any> {
    // Por ahora enviamos usuarioId: 1 fijo (simulado) hasta que tengamos Login real
    const body = {
      productoId: productoId,
      // usuarioId: 1, 
      monto: monto
    };
    // Nota: Cambiamos la URL base porque el endpoint de pujas es distinto
    return this.http.post(`${this.apiUrlSubastas}/pujar`, body);
  }

  // Obtener historial de pujas del usuario logueado
  getMisPujas(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrlUsuario}/mis-pujas`);
  }

  // Obtener subastas ganadas
  getMisCompras(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrlUsuario}/mis-compras`);
  }

  // Método para enviar el formulario con imagen
  crearProducto(productoData: FormData): Observable<any> {
    // Nota: NO seteamos Content-Type manualmente, Angular lo hace solo al ver FormData
    return this.http.post(`${this.apiUrlProductos}`, productoData);
  }

  // Obtener detalle de una orden (para la pantalla de pago)
  getOrdenById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrlOrdenes}/${id}`);
  }

  // Pagar la orden
  pagarOrden(id: number): Observable<any> {
    // Enviamos un POST vacío porque no hay datos de tarjeta reales
    // En la vida real, aquí enviarías el token de Stripe/Transbank
    return this.http.post(`${this.apiUrlOrdenes}/${id}/pagar`, {}, { responseType: 'text' });
  }
}