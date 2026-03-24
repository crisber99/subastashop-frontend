import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class StripeService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/stripe`;

  createCheckoutSession(): Observable<any> {
    return this.http.post(`${this.apiUrl}/create-checkout-session`, {});
  }
}
