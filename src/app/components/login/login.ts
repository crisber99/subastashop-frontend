import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth-service';

@Component({
  selector: 'app-login',
  standalone: true, // Agregué esto por si acaso usas standalone
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.html', 
  styleUrl: './login.scss', 
})
export class LoginComponent {
  authService = inject(AuthService);
  router = inject(Router);

  email = '';
  password = '';
  mensajeError = '';
  cargando = false; // Un detallito extra visual

  onLogin() {
    this.mensajeError = '';
    this.cargando = true;
    const credenciales = { email: this.email, password: this.password };
    
    this.authService.login(credenciales).subscribe({
      next: () => {
        // El servicio ya guardó el token y actualizó las señales.
        // Redirigimos al inicio.
        this.router.navigate(['/']);
      },
      error: (err) => {
        console.error(err);
        this.cargando = false;
        if (err.status === 401 || err.status === 403) {
             this.mensajeError = 'Correo o contraseña incorrectos.';
        } else {
             this.mensajeError = 'Error de conexión con el servidor.';
        }
      }
    });
  }
}