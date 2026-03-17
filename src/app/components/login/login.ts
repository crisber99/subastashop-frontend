import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth-service';
import Swal from 'sweetalert2'; // 👈 Importar

@Component({
  selector: 'app-login',
  standalone: true, 
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
  cargando = false; 

  onLogin() {
    this.mensajeError = '';
    this.cargando = true;

    // Spinner
    Swal.fire({
        title: 'Iniciando Sesión...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
        background: 'transparent', // Opcional: para que se vea moderno
        backdrop: 'rgba(0,0,0,0.8)',
        color: '#fff'
    });

    const credenciales = { email: this.email, password: this.password };
    
    this.authService.login(credenciales).subscribe({
      next: () => {
        Swal.close();
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.cargando = false;
        Swal.close();
        if (err.status === 401 || err.status === 403) {
             this.mensajeError = 'Correo o contraseña incorrectos.';
             Swal.fire('Error', 'Credenciales incorrectas', 'error');
        } else {
             // El backend ahora devuelve: {"error": "mensaje"}
             this.mensajeError = err.error?.error || err.error?.message || err.message || 'Error de conexión con el servidor.';
             Swal.fire('Error', this.mensajeError, 'error');
        }
      }
    });
  }
}