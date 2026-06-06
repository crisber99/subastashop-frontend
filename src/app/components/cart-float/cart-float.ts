import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { RouterModule, Router } from '@angular/router';
import { CartService } from '../../services/cart';
import { OrdenService } from '../../services/orden';
import Swal from 'sweetalert2';
import confetti from 'canvas-confetti'; // 👈 Importar Confetti

declare var bootstrap: any;

@Component({
  selector: 'app-cart-float',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './cart-float.html',
  styleUrl: './cart-float.scss',
})
export class CartFloat {

  public cartService = inject(CartService);
  private ordenService = inject(OrdenService);
  private router = inject(Router);

  loading = false;

  confirmarReserva() {
    if (this.cartService.items().length === 0) return;

    // Confirmación previa
    Swal.fire({
      title: '¿Confirmar Orden?',
      text: `Vas a reservar ${this.cartService.cantidadItems()} productos.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, Confirmar',
      confirmButtonColor: '#198754', // Verde éxito
      cancelButtonText: 'Seguir mirando'
    }).then((result) => {
      if (result.isConfirmed) {
        this.procesarOrden();
      }
    });
  }

  procesarOrden() {
    this.loading = true;
    
    // Loader visual
    Swal.fire({
      title: 'Procesando...',
      text: 'Estamos reservando tus productos',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    const detallesBackend = this.cartService.items().map(item => ({
      productoId: item.producto.id,
      cantidad: item.cantidad,
      tipoCompra: item.tipo, 
      datosExtra: item.extra 
    }));

    const request = { detalles: detallesBackend };

    this.ordenService.crearOrden(request).subscribe({
      next: (ordenCreada: any) => {
        this.loading = false;
        Swal.close(); // Cerramos loader

        // Disparar confeti (Gamificación)
        this.lanzarConfeti();

        // Cerrar Offcanvas
        this.cerrarOffcanvas();

        // Limpiar Carrito
        this.cartService.limpiarCarrito();

        // Éxito y Redirección
        Swal.fire({
          icon: 'success',
          title: '¡Orden Creada!',
          text: 'Ve a "Mis Compras" para completar el pago.',
          confirmButtonText: 'Ir a Pagar'
        }).then(() => {
          this.router.navigate(['/mis-compras']);
        });
      },
      error: (err) => {
        this.loading = false;
        console.error(err);
        const mensajeError = err.error || 'Error desconocido';

        if (mensajeError.includes('ya no está disponible')) {
          Swal.fire({
            icon: 'warning',
            title: '¡Ups! Te ganaron',
            text: mensajeError,
            confirmButtonText: 'Entendido'
          }).then(() => {
            this.cartService.limpiarCarrito();
            this.cerrarOffcanvas();
          });
        } else {
          Swal.fire('Error', mensajeError, 'error');
        }

        // --- LIMPIEZA DE SEGURIDAD ---
        this.cerrarOffcanvas();
      }
    });
  }

  private lanzarConfeti() {
    const duration = 3 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcff42', '#ffa62d', '#ff36ff']
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcff42', '#ffa62d', '#ff36ff']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }

  private cerrarOffcanvas() {
    const offcanvasEl = document.getElementById('offcanvasCarrito');
    if (offcanvasEl) {
      const offcanvas = bootstrap.Offcanvas.getInstance(offcanvasEl) || new bootstrap.Offcanvas(offcanvasEl);
      offcanvas.hide();

      // Forzar limpieza de backdrop
      setTimeout(() => {
        const backdrops = document.querySelectorAll('.offcanvas-backdrop');
        backdrops.forEach(b => b.remove());
        document.body.classList.remove('offcanvas-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
      }, 300);
    }
  }
}
