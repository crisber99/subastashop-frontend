import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class Shop {
  private http = inject(HttpClient);
  // Ajusta tu URL base si es necesario
  private apiUrl = `${environment.apiUrl}`; 

  // Obtener todas las tiendas para la Landing
  getTiendas() {
    return this.http.get<any[]>(`${this.apiUrl}/public/tiendas`);
  }
}