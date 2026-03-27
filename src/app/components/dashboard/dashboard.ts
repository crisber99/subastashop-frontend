import { Component, inject, OnInit } from '@angular/core';
import { ProductService } from '../../services/product';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { OrdenService } from '../../services/orden';
import { CartService } from '../../services/cart';   
import { AuthService } from '../../services/auth-service';
import { PushNotificationService } from '../../services/push-notification.service';
import Swal from 'sweetalert2'; 

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {

  private productService = inject(ProductService);
  private ordenService = inject(OrdenService);
  public cartService = inject(CartService); 
  public authService = inject(AuthService);
  public pushService = inject(PushNotificationService);
  private router = inject(Router);

  pujas: any[] = [];
  ordenes: any[] = [];
  ordenesPendientes: any[] = [];
  ordenesPagadas: any[] = [];
  tabActual: string = 'carrito'; 

  stats = {
    usuarios: 0,
    ventas: 0,
    subastasActivas: 0,
    ingresos: 0
  };

  loading = false;

  ngOnInit() {
    this.cargarDatos();

    if (this.cartService.items().length > 0) {
        this.verificarDisponibilidadCarrito();
    }

    if (this.cartService.cantidadItems() > 0) {
      this.tabActual = 'carrito';
    } else {
      this.tabActual = 'compras';
    }
  }

  cargarDatos() {
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

    this.productService.getMisPujas().subscribe(data => this.pujas = data);
    this.ordenService.getMisOrdenes().subscribe({
      next: (data) => {
        this.ordenes = data;
        this.filtrarOrdenes();
      },
      error: (err) => console.error('Error cargando órdenes', err)
    });
  }

  filtrarOrdenes() {
    this.ordenesPendientes = this.ordenes.filter(o => o.estado === 'PENDIENTE_PAGO');
    this.ordenesPagadas = this.ordenes.filter(o => o.estado === 'PAGADO');
  }

  procesarCompraCarrito() {
    if (this.cartService.cantidadItems() === 0) return;
    
    Swal.fire({
        title: '¿Finalizar Compra?',
        text: `Vas a generar una orden por ${this.cartService.cantidadItems()} productos.`,
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: 'Sí, Comprar',
        confirmButtonColor: '#3085d6'
    }).then((result) => {
        if(result.isConfirmed) {
            this.ejecutarCompra();
        }
    });
  }

  ejecutarCompra() {
    this.loading = true;
    Swal.fire({title: 'Procesando...', allowOutsideClick: false, didOpen: () => Swal.showLoading()});

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
        
        Swal.fire({
            icon: 'success',
            title: '¡Orden Creada!',
            text: 'Revisa la pestaña "Mis Compras" para ver el detalle.',
            timer: 2000
        });

        this.cartService.limpiarCarrito(); 
        this.cargarDatos();                
        this.tabActual = 'compras';        
      },
      error: (err) => {
        this.loading = false;
        Swal.fire('Error', err.error || 'No se pudo procesar la compra.', 'error');
      }
    });
  }

  verificarDisponibilidadCarrito() {
    const items = this.cartService.items();
    items.forEach(item => {
        if (item.tipo === 'DIRECTA') {
            this.productService.getProductoById(item.producto.id).subscribe({
                next: (prodActualizado) => {
                    if (prodActualizado.estado !== 'DISPONIBLE') {
                        Swal.fire({
                            icon: 'warning',
                            title: 'Producto Agotado',
                            text: `El producto "${prodActualizado.nombre}" ya no está disponible. Fue eliminado del carrito.`,
                            toast: true,
                            position: 'top-end',
                            timer: 5000
                        });
                        this.cartService.eliminarItemPorId(prodActualizado.id);
                    }
                },
                error: (err) => console.error("Error verificando stock", err)
            });
        }
    });
  }

  cambiarTab(tab: string) {
    this.tabActual = tab; 
    if (tab === 'carrito') {
        this.verificarDisponibilidadCarrito();
    } 
    else if (tab === 'compras') {
        this.recargarOrdenes();
    }
    else if (tab === 'pujas') {
        this.recargarPujas();
    }
  }

  recargarOrdenes() {
    this.loading = true; 
    this.ordenService.getMisOrdenes().subscribe({
        next: (data) => {
            this.ordenes = data;
            this.filtrarOrdenes();
            this.loading = false;
        },
        error: (err) => {
            console.error(err);
            this.loading = false;
        }
    });
  }

  recargarPujas() {
      this.productService.getMisPujas().subscribe(data => this.pujas = data);
  }
}