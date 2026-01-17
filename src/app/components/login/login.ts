import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth-service';

@Component({
  selector: 'app-login',
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

  onLogin() {
    const credenciales = { email: this.email, password: this.password };
    
    this.authService.login(credenciales).subscribe({
      next: () => {
        // Si sale bien, vamos al inicio
        this.router.navigate(['/']);
      },
      error: (err) => {
        console.error(err);
        this.mensajeError = 'Credenciales incorrectas';
      }
    });
  }
}