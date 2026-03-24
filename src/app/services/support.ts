import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface SupportTicket {
  id?: number;
  asunto: string;
  mensaje: string;
  respuestaAdmin?: string;
  estado?: 'ABIERTO' | 'CERRADO';
  fechaCreacion?: string;
  fechaRespuesta?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SupportService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/support`;

  createTicket(ticket: SupportTicket): Observable<SupportTicket> {
    return this.http.post<SupportTicket>(this.apiUrl, ticket);
  }

  getMyTickets(): Observable<SupportTicket[]> {
    return this.http.get<SupportTicket[]>(`${this.apiUrl}/me`);
  }

  getAllTickets(): Observable<SupportTicket[]> {
    return this.http.get<SupportTicket[]>(`${this.apiUrl}/all`);
  }

  replyTicket(id: number, respuesta: string): Observable<SupportTicket> {
    return this.http.post<SupportTicket>(`${this.apiUrl}/${id}/reply`, { respuesta });
  }
}
