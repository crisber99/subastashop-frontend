import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth-service';

@Injectable({
  providedIn: 'root'
})
export class AiChatService {
  private authService = inject(AuthService);
  private apiUrl = environment.apiUrl;

  /**
   * Conecta con el flujo de streaming SSE para el soporte RAG.
   */
  getStreamingSupportResponse(prompt: string): Observable<string> {
    const token = this.authService.getToken();
    const url = `${this.apiUrl}/ai/support/stream?prompt=${encodeURIComponent(prompt)}&token=${token}`;

    return new Observable<string>(observer => {
      const eventSource = new EventSource(url);

      eventSource.onmessage = (event) => {
        // En SSE de Spring AI, el contenido llega directamente en el data
        observer.next(event.data);
      };

      eventSource.onerror = (error) => {
        if (eventSource.readyState === EventSource.CLOSED) {
          observer.complete();
        } else {
          observer.error(error);
          eventSource.close();
        }
      };

      return () => {
        eventSource.close();
      };
    });
  }

  /**
   * Conecta con el flujo de streaming SSE para el análisis de administrador.
   */
  getStreamingAnalysisResponse(prompt: string): Observable<string> {
    const token = this.authService.getToken();
    const url = `${this.apiUrl}/ai/admin/analysis/stream?prompt=${encodeURIComponent(prompt)}&token=${token}`;

    return new Observable<string>(observer => {
      const eventSource = new EventSource(url);

      eventSource.onmessage = (event) => {
        observer.next(event.data);
      };

      eventSource.onerror = (error) => {
        if (eventSource.readyState === EventSource.CLOSED) {
          observer.complete();
        } else {
          observer.error(error);
          eventSource.close();
        }
      };

      return () => {
        eventSource.close();
      };
    });
  }
}
