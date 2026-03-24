import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CalificacionService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/calificaciones`;

  getCalificacionesByProducto(productoId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/producto/${productoId}`);
  }

  crearCalificacion(datos: { productoId: number, puntuacion: number, comentario: string }): Observable<any> {
    return this.http.post<any>(this.apiUrl, datos);
  }
}
