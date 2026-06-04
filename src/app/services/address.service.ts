import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AddressService {
  private http = inject(HttpClient);
  private readonly NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

  searchAddress(query: string): Observable<any[]> {
    const params = new HttpParams()
      .set('q', query)
      .set('format', 'json')
      .set('countrycodes', 'cl') // Restringir a Chile
      .set('addressdetails', '1') // Crucial para obtener calle, comuna, región
      .set('email', 'soporte@subastashop.com') // Requerido por Nominatim para no bloquear por User-Agent
      .set('limit', '5');

    // Headers recomendados por Nominatim (User-Agent) para no ser bloqueados
    return this.http.get<any[]>(this.NOMINATIM_URL, { 
      params
    });
  }
}
