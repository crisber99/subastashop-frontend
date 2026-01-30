import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common'; // 👈 ARREGLA EL ERROR 'No pipe found with name number'
import { RouterModule, Router } from '@angular/router';
import { CartService } from '../../services/cart';
import { OrdenService } from '../../services/orden';

declare var bootstrap: any;

@Component({
  selector: 'app-cart-float',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './cart-float.html',
  styleUrl: './cart-float.scss',
})
export class CartFloat {

  // 👈 ARREGLA EL ERROR 'Property cartService does not exist'
  public cartService = inject(CartService);
  private ordenService = inject(OrdenService);
  private router = inject(Router);

  loading = false;

  // 👈 ARREGLA EL ERROR 'confirmarReserva does not exist'
  confirmarReserva() {
    if (this.cartService.items().length === 0) return;

    this.loading = true;

    // Convertimos el carrito al formato que espera el Backend (OrdenRequest)
    const detallesBackend = this.cartService.items().map(item => ({
      productoId: item.producto.id,
      cantidad: item.cantidad,
      tipoCompra: item.tipo, // 'DIRECTA', 'RIFA', etc.
      datosExtra: item.extra // Número de ticket si es rifa
    }));

    const request = {
      detalles: detallesBackend
    };

    this.ordenService.crearOrden(request).subscribe({
      next: (ordenCreada: any) => {
        this.loading = false;

        // 1. Cerrar Modal
        const modalEl = document.getElementById('modalCarrito');
        const modal = bootstrap.Modal.getInstance(modalEl);
        modal?.hide();

        // 2. Limpiar Carrito
        this.cartService.limpiarCarrito();

        // 3. Redirigir a "Mis Compras"
        alert('✅ Orden creada con éxito. Ve a "Mis Compras" para pagar.');
        this.router.navigate(['/mis-compras']); // Asegúrate de tener esta ruta en app.routes.ts
      },
      error: (err) => {
        this.loading = false;
        console.error(err);
        const mensajeError = err.error || 'Error desconocido';

        if (mensajeError.includes('ya no está disponible')) {
          alert('⚠️ ¡Ups! Alguien fue más rápido.\n\n' + mensajeError);

          // 🔥 SOLUCIÓN PRO: Limpiamos el carrito automáticamente
          // O idealmente, solo borramos el item conflictivo, 
          // pero para empezar, limpiar todo evita inconsistencias.
          this.cartService.limpiarCarrito();

          // Cerrar el modal para que no sigan intentando
          const modalEl = document.getElementById('modalCarrito');
          const modal = bootstrap.Modal.getInstance(modalEl);
          modal?.hide();
        } else {
          alert('❌ Error al procesar: ' + mensajeError);
        }
      }
    });
  }
}
