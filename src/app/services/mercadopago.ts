import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MercadoPagoService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/mercadopago`;

  createSubscriptionPreference(): Observable<{id: string}> {
    return this.http.post<{id: string}>(`${this.apiUrl}/create-preference`, {});
  }
}
