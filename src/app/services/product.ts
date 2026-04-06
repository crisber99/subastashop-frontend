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
  private apiUrlContests = `${environment.apiUrl}/contests`;
  private apiUrlAdmin = `${environment.apiUrl}/admin`;
  private apiUrlPublic = `${environment.apiUrl}/public`;
  private apiUrlSnipers = `${environment.apiUrl}/snipers`;

  getProductos(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrlProductos);
  }

  getProductoById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrlProductos}/${id}`);
  }

  getProductoBySlug(slug: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrlProductos}/p/${slug}`);
  }

  updateProducto(id: number, producto: any, imagenes?: File[]) {
    const formData = new FormData();
    formData.append('nombre', producto.nombre);
    formData.append('descripcion', producto.descripcion);
    formData.append('precioBase', producto.precioBase);
    formData.append('fechaFin', producto.fechaFinSubasta || '');
    
    if (producto.fechaInicioSubasta) {
      formData.append('fechaInicioSubasta', producto.fechaInicioSubasta);
    }
    if (producto.horasVentaAnticipada) {
      formData.append('horasVentaAnticipada', producto.horasVentaAnticipada.toString());
    }

    if (producto.categoriaId) {
      formData.append('categoriaId', producto.categoriaId.toString());
    }
    formData.append('chatHabilitado', producto.chatHabilitado ? 'true' : 'false');
    formData.append('destacado', producto.destacado ? 'true' : 'false');
    if (producto.numeroPares) {
      formData.append('numeroPares', producto.numeroPares.toString());
    }

    if (imagenes && imagenes.length > 0) {
      imagenes.forEach(file => {
        formData.append('archivos', file);
      });
    }

    return this.http.put(`${this.apiUrlProductos}/${id}`, formData);
  }

  getProductosDestacados(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrlPublic}/productos/destacados`);
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

  unirseAlConcurso(contestId: number) {
    return this.http.post(`${this.apiUrlContests}/${contestId}/join`, {});
  }

  getParticipacionesVendidas(contestId: number) {
    return this.http.get<any[]>(`${this.apiUrlContests}/${contestId}/participants`);
  }

  lanzarConcurso(contestId: number) {
    return this.http.post(`${this.apiUrlContests}/${contestId}/lanzar`, {});
  }

  getParticipacionesAdmin(contestId: number) {
    return this.http.get<any[]>(`${this.apiUrlContests}/${contestId}/admin/detalles`);
  }

  getAdminStats() {
    return this.http.get<any>(`${this.apiUrlAdmin}/stats`);
  }

  getGanadoresConcurso(id: number) {
    return this.http.get<any[]>(`${this.apiUrlContests}/${id}/winners`);
  }

  getMisParticipaciones(contestId: number) {
    return this.http.get<any[]>(`${this.apiUrlContests}/${contestId}/mis-participaciones`);
  }

  getProductosPorTienda(slug: string) {
    return this.http.get<any[]>(`${this.apiUrlPublic}/productos/tienda/${slug}`);
  }

  obtenerTiendaPorSlug(slug: string) {
    return this.http.get<any>(`${this.apiUrlPublic}/tiendas/${slug}`);
  }

  // --- Sniper Bot Settings ---
  configurarSniper(productoId: number, montoMaximo: number): Observable<any> {
    return this.http.post(`${this.apiUrlSnipers}/configurar`, { productoId, montoMaximo });
  }

  obtenerSniper(productoId: number): Observable<any> {
    return this.http.get(`${this.apiUrlSnipers}/producto/${productoId}`);
  }

  desactivarSniper(productoId: number): Observable<any> {
    return this.http.post(`${this.apiUrlSnipers}/desactivar/${productoId}`, {});
  }

  acceptLegalTerms(type: string, version: string = 'v1.0'): Observable<any> {
    const body = { type, version };
    return this.http.post(`${environment.apiUrl}/legal/accept`, body);
  }

  // --- Store Config ---
  getStoreConfig(): Observable<any> {
    return this.http.get<any>(`${this.apiUrlPublic}/config`);
  }
}