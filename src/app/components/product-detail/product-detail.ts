import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ProductService } from '../../services/product';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth-service';
import { Websocket } from '../../services/websocket';
import { SuperAdminService } from '../../services/super-admin';
import { CartService } from '../../services/cart';
import { LayoutService } from '../../services/layout';
import Swal from 'sweetalert2';

declare var bootstrap: any;

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.scss',
})
export class ProductDetail implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private productService = inject(ProductService);
  private superAdminService = inject(SuperAdminService);
  public layoutService = inject(LayoutService);
  cartService = inject(CartService);
  
  websocketService = inject(Websocket);
  authService = inject(AuthService);

  producto: any = null;
  montoOferta: number = 0;
  mensaje: string = '';
  esError: boolean = false;

  // Variables Rifa
  numerosRifa: number[] = [];
  ticketsVendidos: number[] = [];
  ticketsDetalle: any[] = [];
  ganadores: any[] = [];
  
  // Variables de Tienda
  productos: any[] = [];
  nombreTienda: string = '';
  tienda: any = null; 

  // Estado visual
  subastaFinalizada: boolean = false;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.cargarProducto(Number(id));
    }

    this.websocketService.obtenerActualizaciones().subscribe((mensaje: any) => {
      if (this.producto && this.producto.id === mensaje.productoId) {
        if (mensaje.tipo === 'TICKET_VENDIDO') {
          const num = mensaje.numero;
          if (!this.ticketsVendidos.includes(num)) {
            this.ticketsVendidos.push(num);
          }
          if (this.authService.isAdmin()) {
            this.cargarTablaAdmin();
          }
        } else if (mensaje.tipo === 'SORTEO_FINALIZADO') {
          this.ganadores = mensaje.ganadores;
          Swal.fire({
            title: '¡Sorteo Finalizado! 🎉',
            text: 'Los ganadores han sido seleccionados. Revisa la lista oficial.',
            icon: 'info',
            timer: 5000,
            timerProgressBar: true
          });
          this.cargarProducto(this.producto.id);
        } else if (mensaje.monto) {
          this.producto.precioActual = mensaje.monto;
          const badge = document.getElementById('precio-badge');
          if (badge) {
            badge.classList.add('bg-warning');
            setTimeout(() => badge.classList.remove('bg-warning'), 500);
          }
          const Toast = Swal.mixin({
             toast: true, position: 'top-end', showConfirmButton: false, timer: 3000
          });
          Toast.fire({ icon: 'info', title: `Nueva puja: $${mensaje.monto}` });
        }
      }
    });
  }

  cargarProducto(id: number) {
    this.productService.getProductoById(id).subscribe({
      next: (data) => {
        this.producto = data; 
        if (data.tienda) this.tienda = data.tienda; 

        if (this.producto.tipoVenta === 'RIFA') {
          this.generarNumeros(this.producto.cantidadNumeros);
          this.cargarVendidos();
          if (this.authService.isAdmin()) this.cargarTablaAdmin();
          if (this.producto.estado === 'FINALIZADA' || this.producto.estado === 'VENDIDO') this.cargarGanadoresHistorial();
        }

        this.websocketService.conectar(() => {
          this.websocketService.suscribirseProducto(this.producto.id);
        });

        if (data.tipoVenta === 'SUBASTA' && data.fechaFinSubasta) {
          const fechaFin = new Date(data.fechaFinSubasta);
          const ahora = new Date();
          if (fechaFin < ahora) {
            this.subastaFinalizada = true;
            this.mensaje = 'Esta subasta ha finalizado.';
            this.esError = true;
          } else {
            this.subastaFinalizada = false;
            this.montoOferta = (data.precioActual || data.precioBase) + 1000;
          }
        }
      },
      error: (err) => console.error('Error cargando producto:', err)
    });
  }

  pujar() {
    if (!this.producto || this.subastaFinalizada) return;
    this.productService.realizarPuja(this.producto.id, this.montoOferta).subscribe({
      next: (resp) => {
        Swal.fire({
            icon: 'success', title: '¡Oferta realizada!', text: 'Eres el mayor postor por ahora.',
            toast: true, position: 'top-end', timer: 3000, showConfirmButton: false
        });
        this.mensaje = '¡Oferta realizada con éxito!';
        this.esError = false;
        this.cargarProducto(this.producto.id); 
      },
      error: (err) => {
        const msg = err.error?.message || err.error || 'Error al realizar la puja';
        this.mensaje = msg;
        this.esError = true;
        Swal.fire('Error', msg, 'error');
      }
    });
  }

  agregarAlCarrito() {
    this.cartService.agregarItem(this.producto, 'DIRECTA');
    Swal.fire({
        icon: 'success', title: 'Agregado', text: 'Producto añadido al carrito',
        toast: true, position: 'bottom-end', timer: 2000, showConfirmButton: false
    });
  }

  cargarTablaAdmin() {
    this.productService.getDetallesRifaAdmin(this.producto.id).subscribe(data => {
      this.ticketsDetalle = data.sort((a: any, b: any) => a.numero - b.numero);
    });
  }

  cargarGanadoresHistorial() {
    this.productService.getGanadoresRifa(this.producto.id).subscribe({
      next: (data) => {
        this.ganadores = data || [];
      },
      error: () => this.ganadores = []
    });
  }

  generarNumeros(cantidad: number) {
    this.numerosRifa = Array.from({ length: cantidad }, (_, i) => i + 1);
  }

  cargarVendidos() {
    this.productService.getTicketsVendidos(this.producto.id).subscribe(data => {
      this.ticketsVendidos = data;
    });
  }

  isTicketVendido(num: number): boolean {
    return this.ticketsVendidos.includes(num);
  }

  comprarNumero(num: number) {
    Swal.fire({
        title: `¿Comprar el #${num}?`, text: `El precio es $${this.producto.precioTicket}`,
        icon: 'question', showCancelButton: true, confirmButtonText: 'Sí, comprar', cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            this.productService.comprarTicket(this.producto.id, num).subscribe({
                next: () => {
                  Swal.fire('¡Comprado!', `Ticket #${num} reservado exitosamente.`, 'success');
                  this.cargarVendidos();
                },
                error: (err) => {
                  if (err.status === 200) {
                    Swal.fire('¡Comprado!', `Ticket #${num} reservado exitosamente.`, 'success');
                    this.cargarVendidos();
                  } else {
                    const errorMsg = err.error?.message || 'No se pudo comprar el ticket';
                    Swal.fire('Error', errorMsg, 'error');
                  }
                }
            });
        }
    });
  }

  lanzarSorteo() {
    Swal.fire({
        title: '¿Lanzar Sorteo?', text: 'Se seleccionarán los ganadores aleatoriamente.',
        icon: 'warning', showCancelButton: true, confirmButtonText: '¡Girar Tómbola!',
    }).then((res) => {
        if(res.isConfirmed) {
            Swal.fire({ title: 'Sorteando...', didOpen: () => Swal.showLoading() });
            this.productService.lanzarRifa(this.producto.id).subscribe({
                next: (listaGanadores: any) => {
                  this.ganadores = listaGanadores;
                  Swal.fire({ title: '🏆 ¡GANADORES!', icon: 'success' });
                  this.cargarProducto(this.producto.id);
                },
                error: (err) => Swal.fire('Error', 'Error al lanzar rifa', 'error')
            });
        }
    });
  }

  reportarProducto() {
    Swal.fire({
        title: 'Reportar Producto', input: 'textarea', showCancelButton: true, confirmButtonText: 'Enviar Reporte',
    }).then((result) => {
        if (result.isConfirmed && result.value) {
            this.superAdminService.reportarProducto(this.producto.id, result.value).subscribe({
                next: () => Swal.fire('Enviado', 'Gracias.', 'success'),
                error: () => Swal.fire('Error', 'No se pudo enviar el reporte.', 'error')
            });
        }
    });
  }

  abrirModalPago() {
    const modalElement = document.getElementById('modalPago');
    if (modalElement) {
      const modal = new bootstrap.Modal(modalElement);
      modal.show();
    }
  }

  ngOnDestroy() {
    this.websocketService.desconectar();
  }
}