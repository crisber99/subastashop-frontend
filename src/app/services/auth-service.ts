import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  
  // URL de tu Backend en Azure
  private apiUrl = `${environment.apiUrl}/auth`;
  private tokenKey = 'subasta_token';
  private userKey = 'subasta_user'; // Clave nueva para guardar datos del usuario

  // --- SEÑALES (SIGNALS) ---
  // Esto permite que el HTML se actualice solo cuando cambian los datos
  currentUser = signal<any>(null);
  isLoggedIn = signal<boolean>(false);

  constructor() {
    this.recuperarSesion(); // Intentar recuperar login al iniciar la app
  }

  // --- REGISTRO ---
  register(datos: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, datos).pipe(
      tap((response: any) => {
        if (response.token) {
          // Asumimos que el backend devuelve: { token: "...", usuario: { nombre: "...", role: "..." } }
          this.guardarSesion(response.token, response.usuario);
        }
      })
    );
  }

  // --- LOGIN ---
  login(datos: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, datos).pipe(
      tap((response: any) => {
        if (response.token) {
          this.guardarSesion(response.token, response.usuario);
        }
      })
    );
  }

  // --- CERRAR SESIÓN ---
  logout() {
    // 1. Borrar de disco
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    
    // 2. Borrar de memoria (Señales)
    this.currentUser.set(null);
    this.isLoggedIn.set(false);

    // 3. Redirigir suavemente sin recargar toda la página
    this.router.navigate(['/login']);
  }

  // --- MÉTODOS PRIVADOS Y AUXILIARES ---

  private guardarSesion(token: string, usuario: any) {
    // Guardar Token
    localStorage.setItem(this.tokenKey, token);
    
    // Guardar Usuario (si viene nulo, guardamos un objeto vacío para que no rompa)
    const usuarioAGuardar = usuario || { nombre: 'Usuario', role: 'USER' };
    localStorage.setItem(this.userKey, JSON.stringify(usuarioAGuardar));

    // Actualizar Señales
    this.currentUser.set(usuarioAGuardar);
    this.isLoggedIn.set(true);
  }

  private recuperarSesion() {
    const token = localStorage.getItem(this.tokenKey);
    const userStr = localStorage.getItem(this.userKey);

    if (token && userStr) {
      this.isLoggedIn.set(true);
      try {
        this.currentUser.set(JSON.parse(userStr));
      } catch (e) {
        console.error("Error al leer usuario del storage", e);
      }
    }
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  isAdmin(): boolean {
    const user = this.currentUser();
    console.log('Usuario actual:', user); 
    return user && (user.role === 'ROLE_ADMIN');
}
}