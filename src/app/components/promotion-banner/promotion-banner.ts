import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth-service';
import { ThemeService } from '../../services/theme-service';
import { MercadoPagoService } from '../../services/mercadopago';
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
  themeService = inject(ThemeService);
  mpService = inject(MercadoPagoService);
  router = inject(Router);

  mostrarBanner = true;

  // Lógica de mensaje dinámico
  mensaje = computed(() => {
    const user = this.authService.currentUser();
    if (!this.authService.isLoggedIn()) {
      return '¡Únete hoy por solo $4.990/mes! (Solo 100 cupos disponibles)';
    }

    const role = user.rol || user.role;
    const hasTienda = !!user.tienda;
    const isPro = this.authService.hasActiveSubscription();

    if (role === 'ROLE_COMPRADOR') {
      return '¡Crea tu propia tienda hoy mismo! 🏪🚀 Asegura tu cupo por $4.990/mes';
    }

    if (hasTienda && !isPro) {
      return '🚀 ¡Haz tu tienda PRO por solo $4.990! Mejora tus ventas hoy mismo.';
    }

    if (isPro) {
      return '¡Felicidades! Ya eres un usuario PRO. Disfruta de tus beneficios. ⭐';
    }

    return '¡Únete a la comunidad Pro por solo $4.990/mes! 🚀';
  });

  action() {
    const user = this.authService.currentUser();
    if (this.authService.isLoggedIn()) {
        const isPro = this.authService.hasActiveSubscription();
        
        if (isPro) {
            Swal.fire('¡Ya eres Pro!', 'Ya tienes una suscripción activa. ¡Gracias por apoyarnos!', 'info');
            return;
        }

        // Si no es pro, iniciamos el flujo de pago directo
        Swal.fire({
            title: 'Iniciando Pago...',
            text: 'Te redirigiremos a Mercado Pago para asegurar tu cupo de $4.990.',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });

        this.mpService.createSubscriptionPreference().subscribe({
            next: (res) => {
                if (res.id) {
                    window.location.href = res.id; // Redirección a Mercado Pago
                } else {
                    Swal.fire('Error', 'No se pudo generar la sesión de pago', 'error');
                }
            },
            error: (err) => {
                console.error(err);
                Swal.fire('Error', 'Hubo un problema al conectar con la pasarela de pagos', 'error');
            }
        });
    } else {
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
