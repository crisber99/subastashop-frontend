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
  private apiUrlRifas = `${environment.apiUrl}/rifas`;
  private apiUrlAdmin = `${environment.apiUrl}/admin`;
  private apiUrlPublic = `${environment.apiUrl}/public`;

  getProductos(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrlProductos);
  }

  getProductoById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrlProductos}/${id}`);
  }

  updateProducto(id: number, producto: any, imagen?: File) {
    const formData = new FormData();
    formData.append('nombre', producto.nombre);
    formData.append('descripcion', producto.descripcion);
    formData.append('precioBase', producto.precioBase);
    formData.append('fechaFin', producto.fechaFin);

    if (imagen) {
      formData.append('imagen', imagen);
    }

    // Usamos PUT para actualizar
    return this.http.put(`${this.apiUrlProductos}/${id}`, formData);
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
  pagarOrden(id: number, datosPago: any) {
    return this.http.post(`${this.apiUrlOrdenes}/${id}/pagar`, datosPago);
  }

  comprarTicket(productoId: number, numero: number) {
    return this.http.post(`${this.apiUrlRifas}/${productoId}/comprar/${numero}`, {});
  }

  getTicketsVendidos(productoId: number) {
    return this.http.get<number[]>(`${this.apiUrlRifas}/${productoId}/tickets`);
  }

  lanzarRifa(productoId: number) {
    return this.http.post(`${this.apiUrlRifas}/${productoId}/lanzar`, {});
  }

  getDetallesRifaAdmin(productoId: number) {
    return this.http.get<any[]>(`${this.apiUrlRifas}/${productoId}/admin/detalles`);
  }

  getAdminStats() {
    return this.http.get<any>(`${this.apiUrlAdmin}/stats`);
  }

  getGanadoresRifa(id: number) {
    return this.http.get<any[]>(`${this.apiUrlRifas}/${id}/ganadores`);
  }

  getProductosPorTienda(slug: string) {
  return this.http.get<any[]>(`${this.apiUrlPublic}/productos/tienda/${slug}`);
}
}