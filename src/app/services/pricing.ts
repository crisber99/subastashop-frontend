import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

export interface PricingStatus {
  faseActual: number;
  precioActual: number;
  precioAncla: number;
  cuposTotalesFase: number;
  cuposOcupadosFase: number;
  cuposRestantes: number;
  totalProUsers: number;
}

@Injectable({
  providedIn: 'root'
})
export class PricingService {
  private apiUrl = `${environment.apiUrl}/v1/pricing`;

  constructor(private http: HttpClient) {}

  getStatus(): Observable<PricingStatus> {
    return this.http.get<PricingStatus>(`${this.apiUrl}/status`);
  }
}
