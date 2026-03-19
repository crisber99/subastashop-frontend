import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth-service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-promotion-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './promotion-banner.html',
  styleUrl: './promotion-banner.scss'
})
export class PromotionBanner {
  authService = inject(AuthService);
  router = inject(Router);

  mostrarBanner = true;

  action() {
    if (this.authService.isLoggedIn()) {
      // Si ya está logueado, tal vez llevar a una página de suscripción o mostrar info
      Swal.fire({
        title: '¡Ya eres parte de la comunidad!',
        text: 'Próximamente podrás activar tu plan premium de $4.990/mes directamente desde tu perfil.',
        icon: 'info',
        confirmButtonText: 'Genial'
      });
    } else {
      // Si no está logueado, preguntar
      Swal.fire({
        title: '¡Asegura tu cupo de $4.990! 🚀',
        text: 'Esta oferta es exclusiva para los primeros 100 inscritos. ¿Ya tienes una cuenta o eres nuevo?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Ya tengo cuenta (Login)',
        cancelButtonText: 'Soy nuevo (Registrarme)',
        confirmButtonColor: '#0d6efd',
        cancelButtonColor: '#198754',
        reverseButtons: true
      }).then((result) => {
        if (result.isConfirmed) {
          this.router.navigate(['/login']);
        } else if (result.dismiss === Swal.DismissReason.cancel) {
          this.router.navigate(['/registro']);
        }
      });
    }
  }

  cerrar() {
    this.mostrarBanner = false;
  }
}
