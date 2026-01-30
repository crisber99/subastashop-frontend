import { Component, inject, OnInit } from '@angular/core';
import { ProductService } from '../../services/product';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { OrdenService } from '../../services/orden';
import { CartService } from '../../services/cart';   // 👈 Nuevo servicio
import { AuthService } from '../../services/auth-service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  
  // Inyecciones
  private productService = inject(ProductService);
  private ordenService = inject(OrdenService);
  public cartService = inject(CartService); // Public para usar signals en HTML
  public authService = inject(AuthService);
  private router = inject(Router);

  // Datos
  pujas: any[] = [];
  ordenes: any[] = [];
  
  // Pestaña activa por defecto
  tabActual: string = 'carrito'; // Empezamos en carrito si hay cosas, o 'pujas'

  // Estadísticas Admin
  stats = {
    usuarios: 0,
    ventas: 0,
    subastasActivas: 0,
    ingresos: 0
  };

  loading = false;

  ngOnInit() {
    this.cargarDatos();
    
    // Si el carrito tiene items, mostramos esa tab primero
    if (this.cartService.cantidadItems() > 0) {
      this.tabActual = 'carrito';
    } else {
      this.tabActual = 'compras';
    }
  }

  cargarDatos() {
    // 1. CARGAR ESTADÍSTICAS (Solo si es Admin)
    if (this.authService.isAdmin()) {
      this.productService.getAdminStats().subscribe({
        next: (data: any) => {
          this.stats = {
            usuarios: data.totalUsuarios,
            subastasActivas: data.subastasActivas,
            ventas: data.ventasCerradas,
            ingresos: data.gananciasTotales
          };
        },
        error: (err) => console.error('Error stats:', err)
      });
    }

    // 2. CARGAR MIS PUJAS (Historial)
    // Asumimos que sigue en ProductService o muévelo a OrdenService si prefieres
    this.productService.getMisPujas().subscribe(data => this.pujas = data);

    // 3. CARGAR MIS COMPRAS (Órdenes creadas)
    // Usamos el OrdenService que creamos recientemente
    this.ordenService.getMisOrdenes().subscribe({
      next: (data) => this.ordenes = data,
      error: (err) => console.error('Error cargando órdenes', err)
    });
  }

  // --- LÓGICA DEL CARRITO DESDE EL DASHBOARD ---
  procesarCompraCarrito() {
    if (this.cartService.cantidadItems() === 0) return;
    this.loading = true;

    // Convertimos carrito a formato Backend
    const detallesBackend = this.cartService.items().map(item => ({
      productoId: item.producto.id,
      cantidad: item.cantidad,
      tipoCompra: item.tipo, 
      datosExtra: item.extra ? String(item.extra) : null
    }));

    const request = { detalles: detallesBackend };

    this.ordenService.crearOrden(request).subscribe({
      next: (orden) => {
        this.loading = false;
        alert('✅ ¡Orden creada exitosamente!');
        
        this.cartService.limpiarCarrito(); // Vaciamos carrito
        this.cargarDatos();                // Recargamos la lista de compras
        this.tabActual = 'compras';        // Movemos al usuario a la pestaña de compras
      },
      error: (err) => {
        this.loading = false;
        alert('❌ Error al procesar: ' + (err.error || 'Intente nuevamente'));
      }
    });
  }
}