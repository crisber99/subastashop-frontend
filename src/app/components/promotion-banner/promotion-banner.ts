import { Component, inject, computed, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth-service';
import { ThemeService } from '../../services/theme-service';
import { MercadoPagoService } from '../../services/mercadopago';
import { PricingService, PricingStatus } from '../../services/pricing';
import { environment } from '../../../environments/environment';
import Swal from 'sweetalert2';

import { Websocket } from '../../services/websocket';

@Component({
  selector: 'app-promotion-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './promotion-banner.html',
  styleUrl: './promotion-banner.scss'
})
export class PromotionBanner implements OnInit {
  authService = inject(AuthService);
  themeService = inject(ThemeService);
  mpService = inject(MercadoPagoService);
  pricingService = inject(PricingService);
  websocketService = inject(Websocket);
  router = inject(Router);

  pricingStatus: PricingStatus | null = null;

  isVisible = computed(() => {
    return this.mostrarBanner() && !this.authService.hasActiveSubscription() && !this.authService.isSuperAdmin();
  });

  mostrarBanner = signal(true);

  ngOnInit() {
    // Reset banner visibility each page load
    this.mostrarBanner.set(true);
    if (this.authService.hasActiveSubscription()) {
      this.mostrarBanner.set(false);
    }
    this.pricingService.getStatus().subscribe({
      next: (status) => this.pricingStatus = status,
      error: (err) => console.error('Error fetching pricing status', err)
    });

    this.websocketService.getFoundersUpdates().subscribe((msg: any) => {
        if (msg && msg.tipo === 'NUEVO_FUNDADOR') {
            // Play sound effect
            try {
                const audio = new Audio('assets/sounds/success.mp3');
                audio.play();
            } catch (e) {}

            Swal.fire({
                title: '¡Validación Social!',
                text: msg.mensaje + ` (Solo quedan ${msg.cuposRestantes})`,
                toast: true,
                position: 'bottom-start',
                icon: 'success',
                showConfirmButton: false,
                timer: 5000,
                timerProgressBar: true
            });

            if (this.pricingStatus) {
                this.pricingStatus.cuposOcupadosFase += 1;
                this.pricingStatus.cuposRestantes -= 1;
            }
        }
    });
  }

  // Lógica de mensaje dinámico
  mensaje = computed(() => {
    const user = this.authService.currentUser();
    
    // Si no tenemos status de pricing, usamos default
    let priceStr = '2.490';
    let cuposStr = '';
    
    if (this.pricingStatus) {
        priceStr = this.pricingStatus.precioActual.toLocaleString('es-CL');
        if (this.pricingStatus.faseActual === 1 || this.pricingStatus.faseActual === 2) {
            cuposStr = `(Solo quedan ${this.pricingStatus.cuposRestantes} cupos)`;
        }
    } else {
        cuposStr = '(Cupos limitados)';
    }

    if (!user || !this.authService.isLoggedIn()) {
      return `¡Únete hoy por solo $${priceStr}/mes! ${cuposStr}`;
    }

    const role = user.role;
    const hasTienda = !!user.tienda;
    const isPro = this.authService.hasActiveSubscription();

    if (role === 'ROLE_COMPRADOR') {
      return `¡Crea tu propia tienda hoy mismo! 🏪🚀 Asegura tu cupo por $${priceStr}/mes ${cuposStr}`;
    }

    if (hasTienda && !isPro) {
      return `🚀 ¡Haz tu tienda PRO por solo $${priceStr}! Mejora tus ventas hoy mismo.`;
    }

    return `¡Únete a la comunidad Pro por solo $${priceStr}/mes! 🚀`;
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

      this.mpService.showPricingModal(this.pricingStatus || undefined).then(result => {
        if (result) {
          if (result.recurring) {
            const email = this.authService.currentUser()?.email || '';
            const amount = this.pricingStatus ? this.pricingStatus.precioActual : 9990;
            this.mpService.showCardPaymentModal(amount, email, environment.mercadopagoPublicKey)
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
      const priceStr = this.pricingStatus ? this.pricingStatus.precioActual.toLocaleString('es-CL') : '2.490';
      Swal.fire({
        title: `¡Asegura tu cupo de $${priceStr}! 🚀`,
        text: 'Esta oferta es exclusiva y limitada. ¿Ya tienes una cuenta o eres nuevo?',
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
    this.mostrarBanner.set(false);
  }
}
