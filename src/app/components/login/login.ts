import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth-service';
import { SocialAuthService, GoogleLoginProvider, FacebookLoginProvider } from '@abacritt/angularx-social-login';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  standalone: true, 
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.html', 
  styleUrl: './login.scss', 
})
export class LoginComponent implements OnInit {
  authService = inject(AuthService);
  router = inject(Router);
  socialAuthService = inject(SocialAuthService);

  email = '';
  password = '';
  mensajeError = '';
  cargando = false; 

  ngOnInit() {
    this.socialAuthService.authState.subscribe((user) => {
      if (user) {
        Swal.fire({ title: 'Autorizando...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        const token = user.provider === 'GOOGLE' ? user.idToken : user.authToken;
        
        this.authService.socialLogin({ provider: user.provider, token: token }).subscribe({
          next: () => {
            Swal.close();
            this.router.navigate(['/']);
          },
          error: (err) => {
             Swal.fire('Error', err.error?.message || 'Error al logear con ' + user.provider, 'error');
          }
        });
      }
    });
  }

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

  // --- LOGIN SOCIAL ---
  socialLogin(provider: string) {
    if (provider === 'Google') {
       this.socialAuthService.signIn(GoogleLoginProvider.PROVIDER_ID).catch(err => {
          console.warn(err);
          Swal.fire('Las credenciales locales faltan', 'Aún no has configurado tu ClientID de Google. Revisa las instrucciones compartidas.', 'info');
       });
    } else if (provider === 'Facebook') {
       this.socialAuthService.signIn(FacebookLoginProvider.PROVIDER_ID).catch(err => {
          console.warn(err);
          Swal.fire('Las credenciales locales faltan', 'Aún no has configurado tu AppID de Facebook. Revisa las instrucciones compartidas.', 'info');
       });
    } else {
       Swal.fire('Apple Connect', 'La integración con Apple requiere añadir el certificado .p8 manual en el backend.', 'info');
    }
  }
}