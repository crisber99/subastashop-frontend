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

  updateProducto(id: number, producto: any, imagenes?: File[]) {
    const formData = new FormData();
    formData.append('nombre', producto.nombre);
    formData.append('descripcion', producto.descripcion);
    formData.append('precioBase', producto.precioBase);
    formData.append('fechaFin', producto.fechaFinSubasta || '');
    if (producto.categoriaId) {
      formData.append('categoriaId', producto.categoriaId.toString());
    }

    if (imagenes && imagenes.length > 0) {
      imagenes.forEach(file => {
        formData.append('archivos', file);
      });
    }

    return this.http.put(`${this.apiUrlProductos}/${id}`, formData);
  }

  realizarPuja(productoId: number, monto: number): Observable<any> {
    const body = {
      productoId: productoId,
      monto: monto
    };
    return this.http.post(`${this.apiUrlSubastas}/pujar`, body);
  }

  getMisPujas(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrlUsuario}/mis-pujas`);
  }

  getMisCompras(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrlUsuario}/mis-compras`);
  }

  // 👇 CORREGIDO: Ahora recibe el FormData directamente listo para enviar
  crearProducto(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrlProductos}`, formData);
  }

  getOrdenById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrlOrdenes}/${id}`);
  }

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

  obtenerTiendaPorSlug(slug: string) {
    return this.http.get<any>(`${this.apiUrlPublic}/tiendas/${slug}`);
  }
}