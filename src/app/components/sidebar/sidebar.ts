import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../services/auth-service';
import { LayoutService } from '../../services/layout';
import { MenuService } from '../../services/menu';
import { MercadoPagoService } from '../../services/mercadopago';
import Swal from 'sweetalert2';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar implements OnInit {
  authService = inject(AuthService);
  layoutService = inject(LayoutService);
  menuService = inject(MenuService);
  router = inject(Router);
  mpService = inject(MercadoPagoService);

  ngOnInit() {
    // Cerrar sidebar automáticamente en cada navegación
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.layoutService.sidebarOpen.set(false);
    });
  }

  // 1. ¿Es Súper Admin? (Ve TODO)
  get isSuperAdmin(): boolean {
    return this.authService.currentUser()?.role === 'ROLE_SUPER_ADMIN';
  }

  // 2. ¿Es Admin de Tienda? (Ve Configuración y Tienda)
  get isAdmin(): boolean {
    return this.authService.currentUser()?.role === 'ROLE_ADMIN';
  }

  // 3. ¿Es Comprador/Vendedor normal? (No es ninguno de los anteriores)
  get isComprador(): boolean {
    return !this.isSuperAdmin && !this.isAdmin;
  }

  lanzarHaztePro() {
    this.layoutService.sidebarOpen.set(false);
    this.mpService.showPricingModal().then(result => {
      if (result) {
        if (result.recurring) {
          this.procesarSuscripcion();
        } else {
          this.procesarPago(result.months);
        }
      }
    });
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
        Swal.fire('Error', 'No se pudo iniciar el proceso de pago con Mercado Pago.', 'error');
      }
    });
  }
}
