import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth-service';
import { ThemeService } from '../../services/theme-service';
import { MercadoPagoService } from '../../services/mercadopago';
import { environment } from '../../../environments/environment';
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
    if (!user || !this.authService.isLoggedIn()) {
      return '¡Únete hoy por solo $4.990/mes! (Solo 100 cupos disponibles)';
    }

    const role = user.role;
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
    if (this.authService.isLoggedIn()) {
      const isPro = this.authService.hasActiveSubscription();
      
      if (isPro) {
        // Opción para usuarios PRO (incluyendo Compradores)
        Swal.fire({
          title: 'Gestionar Suscripción PRO ⭐',
          text: '¿Deseas anular tu suscripción actual? No se realizarán más cobros automáticos tras la cancelación.',
          icon: 'info',
          showCancelButton: true,
          confirmButtonText: 'Sí, anular suscripción',
          cancelButtonText: 'Mantener PRO',
          confirmButtonColor: '#d33'
        }).then((result) => {
          if (result.isConfirmed) {
            Swal.fire({
              title: 'Procesando cancelación...',
              allowOutsideClick: false,
              didOpen: () => Swal.showLoading()
            });

            this.mpService.cancelSubscription().subscribe({
              next: () => {
                Swal.fire('Cancelada', 'Tu suscripción ha sido anulada con éxito.', 'success').then(() => {
                  this.authService.refreshSession().subscribe(() => window.location.reload());
                });
              },
              error: (err: any) => {
                console.error('Error al cancelar', err);
                Swal.fire('Error', 'No se pudo cancelar la suscripción en este momento.', 'error');
              }
            });
          }
        });
        return;
      }

      this.mpService.showPricingModal().then(result => {
        if (result) {
          if (result.recurring) {
            const email = this.authService.currentUser()?.email || '';
            this.mpService.showCardPaymentModal(9990, email, environment.mercadopagoPublicKey)
              .catch(err => console.error('Error en pago desde banner', err));
          } else {
            Swal.fire({
              title: 'Cargando pago...',
              allowOutsideClick: false,
              didOpen: () => Swal.showLoading()
            });
            this.mpService.createSubscriptionPreference(result.months).subscribe({
              next: res => window.location.href = res.id,
              error: () => Swal.fire('Error', 'No se pudo iniciar el pago.', 'error')
            });
          }
        }
      });
    } else {
      // Si no está logueado, invitamos a registrarse
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

  procesarSuscripcion() {
      Swal.fire({
          title: 'Iniciando Suscripción Automática...',
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading()
      });

      this.mpService.createSubscription().subscribe({
          next: (res) => {
              if (res.id) {
                  window.location.href = res.id;
              }
          },
          error: (err) => {
              console.error(err);
              Swal.fire('Error', 'No se pudo iniciar el proceso de suscripción.', 'error');
          }
      });
  }

  procesarPago(months: number) {
    Swal.fire({
      title: 'Redirigiendo a Mercado Pago...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    this.mpService.createSubscriptionPreference(months).subscribe({
      next: (res) => {
        if (res.id) {
          window.location.href = res.id;
        }
      },
      error: (err) => {
        console.error(err);
        Swal.fire('Error', 'No se pudo generar la sesión de pago', 'error');
      }
    });
  }

  cerrar() {
    this.mostrarBanner = false;
  }
}
