import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth-service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register {
  authService = inject(AuthService);
  router = inject(Router);

  form = { nombre: '', email: '', password: '' };
  mensajeError = '';
  cargando = false;

  onSubmit() {
    this.cargando = true;
    
    Swal.fire({
        title: 'Creando cuenta...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
    });

    this.authService.register(this.form).subscribe({
      next: () => {
        Swal.fire({
            icon: 'success',
            title: '¡Cuenta Creada!',
            text: 'Ahora puedes iniciar sesión con tus datos.',
            confirmButtonText: 'Ir al Login'
        }).then(() => {
            this.router.navigate(['/login']);
        });
      },
      error: (err) => {
        this.cargando = false;
        // El backend ahora devuelve: {"error": "mensaje"}
        this.mensajeError = err.error?.error || err.error?.message || err.message || 'Error al registrarse.';
        if (typeof err.error === 'string') this.mensajeError = err.error;
        
        Swal.fire('Error', this.mensajeError, 'error');
      }
    });
  }
}