import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface CuponDTO {
  id?: number;
  codigo: string;
  descuento: number;
  tipo: 'FIJO' | 'PORCENTAJE';
  fechaExpiracion?: string;
  activo?: boolean;
  limiteUso?: number;
  usosActuales?: number;
  tiendaId?: number;
  tiendaNombre?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CuponService {
  private http = inject(HttpClient);
  private apiUrlAdmin = `${environment.apiUrl}/cupones/admin`;
  private apiUrlPublic = `${environment.apiUrl}/cupones`;

  // --- Admin Endpoints ---
  crearCupon(cupon: CuponDTO): Observable<any> {
    return this.http.post(this.apiUrlAdmin, cupon);
  }

  obtenerMisCupones(): Observable<CuponDTO[]> {
    return this.http.get<CuponDTO[]>(this.apiUrlAdmin);
  }

  toggleEstado(id: number): Observable<any> {
    return this.http.put(`${this.apiUrlAdmin}/${id}/toggle`, {});
  }

  // --- Public Endpoints ---
  validarCupon(codigo: string, tiendaId: number): Observable<CuponDTO> {
    let params = new HttpParams().set('codigo', codigo).set('tiendaId', tiendaId.toString());
    return this.http.get<CuponDTO>(`${this.apiUrlPublic}/validar`, { params });
  }
}
