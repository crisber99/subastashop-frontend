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

  form = { nombre: '', email: '', password: '', telefono: '', direccion: '' };
  mensajeError = '';
  cargando = false;

  onSubmit() {
    // VALIDACIÓN LOCAL 🔐
    const passwordPattern = /^(?=.*[0-9])(?=.*[a-zA-Z]).{8,}$/;
    if (!passwordPattern.test(this.form.password)) {
      this.mensajeError = 'La contraseña debe tener al menos 8 caracteres e incluir letras y números.';
      Swal.fire('Atención', this.mensajeError, 'warning');
      return;
    }

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
        this.mensajeError = err.error?.message || err.error?.error || err.message || 'Error al registrarse.';
        Swal.fire('Error', this.mensajeError, 'error');
      }
    });
  }
}