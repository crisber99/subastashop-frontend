import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = 'https://api-subastashop-dhd5gec8hecxfbc9.centralus-01.azurewebsites.net/api/auth';
  private tokenKey = 'subasta_token'; // Nombre para guardar en el navegador

  // --- REGISTRO ---
  register(datos: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, datos).pipe(
      tap((response: any) => {
        if (response.token) {
          this.guardarSesion(response.token);
        }
      })
    );
  }

  // --- LOGIN ---
  login(datos: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, datos).pipe(
      tap((response: any) => {
        if (response.token) {
          this.guardarSesion(response.token);
        }
      })
    );
  }

  // --- CERRAR SESIÓN ---
  logout() {
    localStorage.removeItem(this.tokenKey);
    window.location.reload(); // Recargar para limpiar estados
  }

  // --- MÉTODOS AUXILIARES ---
  private guardarSesion(token: string) {
    localStorage.setItem(this.tokenKey, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  estaLogueado(): boolean {
    return !!this.getToken(); // Devuelve true si existe el token
  }
}