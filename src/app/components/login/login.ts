import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth-service';
import Swal from 'sweetalert2';

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

    Swal.fire({
        title: 'Iniciando Sesión...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
        background: 'transparent',
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
        if (err.status === 401) {
             this.mensajeError = 'Correo o contraseña incorrectos.';
             Swal.fire('Error', 'Credenciales incorrectas', 'error');
        } else {
             this.mensajeError = err.error?.message || err.error?.error || err.message || 'Error de conexión con el servidor.';
             Swal.fire('Error', this.mensajeError, 'error');
        }
      }
    });
  }

  // --- RECUPERACIÓN DE CONTRASEÑA ---
  async onForgotPassword() {
    const { value: email } = await Swal.fire({
      title: 'Recuperar Contraseña',
      input: 'email',
      inputLabel: 'Ingresa tu correo electrónico',
      inputPlaceholder: 'ejemplo@correo.com',
      showCancelButton: true,
      confirmButtonText: 'Enviar Código',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#6366f1'
    });

    if (email) {
      Swal.fire({ title: 'Enviando código...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
      
      this.authService.forgotPassword(email).subscribe({
        next: () => {
          this.promptResetPassword(email);
        },
        error: (err) => {
          Swal.fire('Error', err.error?.message || 'No se pudo enviar el código.', 'error');
        }
      });
    }
  }

  async promptResetPassword(email: string) {
    const { value: formValues } = await Swal.fire({
      title: 'Restablecer Contraseña',
      html:
        '<p class="small text-muted">Ingresa el código que recibiste en tu email y tu nueva contraseña.</p>' +
        '<input id="swal-input1" class="swal2-input" placeholder="Código de 6 dígitos">' +
        '<input id="swal-input2" type="password" class="swal2-input" placeholder="Nueva Contraseña (min 8 car.)">',
      focusConfirm: false,
      preConfirm: () => {
        return [
          (document.getElementById('swal-input1') as HTMLInputElement).value,
          (document.getElementById('swal-input2') as HTMLInputElement).value
        ]
      },
      confirmButtonText: 'Actualizar Contraseña',
      confirmButtonColor: '#6366f1'
    });

    if (formValues) {
      const [code, newPassword] = formValues;
      if (!code || !newPassword) {
        Swal.fire('Error', 'Debes completar ambos campos', 'error');
        return;
      }

      this.authService.resetPassword({ email, code, newPassword }).subscribe({
        next: () => {
          Swal.fire('¡Éxito!', 'Tu contraseña ha sido actualizada. Ya puedes iniciar sesión.', 'success');
        },
        error: (err) => {
          Swal.fire('Error', err.error?.message || 'Código inválido o error al actualizar.', 'error');
        }
      });
    }
  }

  // --- LOGIN SOCIAL (MOCK) ---
  socialLogin(provider: string) {
    Swal.fire({
      title: `Iniciar sesión con ${provider}`,
      text: 'Esta funcionalidad se encuentra en desarrollo y estará disponible pronto.',
      icon: 'info',
      confirmButtonColor: '#6366f1'
    });
  }
}