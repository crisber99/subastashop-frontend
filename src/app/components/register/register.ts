import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth-service';

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
    this.authService.register(this.form).subscribe({
      next: () => {
        alert('¡Registro exitoso! Ahora inicia sesión.');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.cargando = false;
        // Manejo básico de errores del backend
        this.mensajeError = err.error || 'Error al registrarse. Intenta nuevamente.';
      }
    });
  }
}
