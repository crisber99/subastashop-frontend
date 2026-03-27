import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { CartService } from './cart';

export interface AuthUser {
  id?: number;
  nombre?: string;
  email?: string;
  role?: string;
  rol?: string;
  fechaFinPrueba?: string;
  suscripcionActiva?: boolean;
  tiendaId?: number | string;
  tienda?: any;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private cartService = inject(CartService);

  // URL de tu Backend en Azure
  private apiUrl = `${environment.apiUrl}/auth`;
  private tokenKey = 'subasta_token';
  private userKey = 'subasta_user'; // Clave nueva para guardar datos del usuario

  // --- SEÑALES (SIGNALS) ---
  // Esto permite que el HTML se actualice solo cuando cambian los datos
  currentUser = signal<AuthUser | null>(null);
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
    this.cartService.limpiarCarrito();

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

    // Normalizar variable de rol que viene del Backend
    if (usuario && usuario.rol && !usuario.role) {
      usuario.role = usuario.rol;
    }

    // Guardar Usuario (si viene nulo, guardamos un objeto vacío para que no rompa)
    const usuarioAGuardar = usuario || { nombre: 'Usuario', role: 'ROLE_USER' };
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
    return !!(user && user.role === 'ROLE_ADMIN');
  }

  isSuperAdmin(): boolean {
    const user = this.currentUser();
    // Ajusta según cómo guardes el rol en tu token/usuario
    console.log('Super Usuario actual:', user);
    return !!(user && user.role === 'ROLE_SUPER_ADMIN');
  }

  // --- TRIAL Y SUSCRIPCIONES ---
  getTrialDaysLeft(): number {
    const user = this.currentUser();
    if (!user || !user.fechaFinPrueba) return 0;
    
    const fin = new Date(user.fechaFinPrueba);
    const hoy = new Date();
    const dif = fin.getTime() - hoy.getTime();
    const dias = Math.ceil(dif / (1000 * 3600 * 24));
    return dias > 0 ? dias : 0;
  }

  isTrialActive(): boolean {
    return this.getTrialDaysLeft() > 0;
  }

  hasActiveSubscription(): boolean {
    return this.currentUser()?.suscripcionActiva || false;
  }

  // --- RECUPERACIÓN DE CONTRASEÑA ---

  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/forgot-password`, { email });
  }

  resetPassword(datos: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/reset-password`, datos);
  }
}