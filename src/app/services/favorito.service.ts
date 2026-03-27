import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class FavoritoService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/favoritos`;

  // Mantenemos un estado global de los IDs favoritos para actualizar los corazones en tiempo real
  private favoritosIdsSubject = new BehaviorSubject<number[]>([]);
  public favoritosIds$ = this.favoritosIdsSubject.asObservable();

  constructor() { }

  cargarIdsFavoritos() {
    this.http.get<number[]>(`${this.apiUrl}/ids`).subscribe({
      next: (ids) => this.favoritosIdsSubject.next(ids),
      error: (err) => console.error('Error cargando favoritos', err)
    });
  }

  isFavorito(productoId: number): boolean {
    return this.favoritosIdsSubject.value.includes(productoId);
  }

  getFavoritos(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  agregarFavorito(productoId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${productoId}`, {}).pipe(
      tap(() => {
        const actuales = this.favoritosIdsSubject.value;
        if (!actuales.includes(productoId)) {
          this.favoritosIdsSubject.next([...actuales, productoId]);
        }
      })
    );
  }

  eliminarFavorito(productoId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${productoId}`).pipe(
      tap(() => {
        const actuales = this.favoritosIdsSubject.value;
        this.favoritosIdsSubject.next(actuales.filter(id => id !== productoId));
      })
    );
  }

  toggleFavorito(productoId: number): Observable<any> {
    if (this.isFavorito(productoId)) {
      return this.eliminarFavorito(productoId);
    } else {
      return this.agregarFavorito(productoId);
    }
  }
}
