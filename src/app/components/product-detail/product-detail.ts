import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Meta, Title } from '@angular/platform-browser';
import { ProductService } from '../../services/product';
import { AuthService } from '../../services/auth-service';
import { Websocket } from '../../services/websocket';
import { SuperAdminService } from '../../services/super-admin';
import { CartService } from '../../services/cart';
import { LayoutService } from '../../services/layout';
import { CalificacionService } from '../../services/calificacion';
import { FavoritoService } from '../../services/favorito.service';
import Swal from 'sweetalert2';

declare var bootstrap: any;
import confetti from 'canvas-confetti';

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
  calificacionService = inject(CalificacionService);
  public favoritoService = inject(FavoritoService);
  
  titleService = inject(Title);
  metaService = inject(Meta);

  producto: any = null;
  montoOferta: number = 0;
  mensaje: string = '';
  esError: boolean = false;

  // Variables Rifa
  numerosRifa: number[] = [];
  ticketsVendidos: number[] = [];
  ticketsDetalle: any[] = [];
  ganadores: any[] = [];
  
  // Variables del Show de Sorteo ✨
  showSorteo: boolean = false;
  cuentaRegresiva: number = 5;
  ruletaActiva: boolean = false;
  numeroRuleta: number = 0;
  ganadoresRevelados: any[] = [];
  private audioDrum: HTMLAudioElement = new Audio('assets/sounds/drumroll.mp3');
  private audioWin: HTMLAudioElement = new Audio('assets/sounds/win.mp3');
  
  // Variables de Tienda
  productos: any[] = [];
  nombreTienda: string = '';
  tienda: any = null; 

  // Estado visual
  subastaFinalizada: boolean = false;
  isLive: boolean = false;

  // Calificaciones
  calificaciones: any[] = [];
  nuevaPuntuacion: number = 5;
  nuevoComentario: string = '';
  promedioCalificacion: number = 0;

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.favoritoService.cargarIdsFavoritos();
    }

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.cargarProducto(Number(id));
    }

    this.websocketService.getConnectionStatus().subscribe(estado => {
      this.isLive = estado;
    });

    this.websocketService.obtenerActualizaciones().subscribe((mensaje: any) => {
      if (this.producto && Number(this.producto.id) == Number(mensaje.productoId)) {
        
        // --- LOGICA DE SORTEO EN TIEMPO REAL (RIFA) ---
        if (mensaje.status === 'PREPARANDO') {
          this.iniciarSorteoShow();
        } else if (mensaje.status === 'FINALIZADO') {
          this.procesarGanadoresSecuencial(mensaje.ganadores);
        }

        if (mensaje.tipo === 'TICKET_VENDIDO') {
          const num = mensaje.numero;
          if (!this.ticketsVendidos.includes(num)) {
            this.ticketsVendidos.push(num);
          }
          if (this.authService.isAdmin()) {
            this.cargarTablaAdmin();
          }
        } else if (mensaje.tipo === 'SORTEO_FINALIZADO') {
          // Si llega este mensaje genérico pero no el status (retrocompatibilidad)
          this.ganadores = mensaje.ganadores;
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

  iniciarSorteoShow() {
    this.showSorteo = true;
    this.cuentaRegresiva = 5;
    this.audioDrum.play().catch(e => console.log('Audio blocked', e));
    
    const interval = setInterval(() => {
      this.cuentaRegresiva--;
      if (this.cuentaRegresiva <= 0) {
        clearInterval(interval);
      }
    }, 1000);
  }

  async procesarGanadoresSecuencial(ganadores: any[]) {
    this.audioDrum.pause();
    this.audioDrum.currentTime = 0;
    this.ganadoresRevelados = [];
    
    // Invertimos el orden para mostrar del último al primero (3ero -> 2do -> 1ero)
    const ganadoresInvertidos = [...ganadores].sort((a, b) => b.puesto - a.puesto);

    for (const g of ganadoresInvertidos) {
      await this.animarRuleta(g);
      this.ganadoresRevelados.unshift(g); // Lo agregamos al inicio para que el 1ero quede arriba al final
      this.audioWin.play().catch(e => console.log('Audio blocked', e));
    }

    // Final épico con confeti 🎉
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#0d6efd', '#6f42c1', '#f59e0b']
    });

    this.ganadores = ganadores;
    this.ruletaActiva = false;
  }

  animarRuleta(ganador: any): Promise<void> {
    this.ruletaActiva = true;
    return new Promise(resolve => {
      let duration = 3000;
      let start = Date.now();
      
      const timer = setInterval(() => {
        this.numeroRuleta = Math.floor(Math.random() * (this.producto.cantidadNumeros || 100)) + 1;
        if (Date.now() - start >= duration) {
          clearInterval(timer);
          this.numeroRuleta = ganador.numeroTicket;
          setTimeout(() => resolve(), 1000);
        }
      }, 50);
    });
  }

  cerrarShow() {
    this.showSorteo = false;
    this.cargarProducto(this.producto.id);
  }

  cargarProducto(id: number) {
    this.productService.getProductoById(id).subscribe({
      next: (data) => {
        this.producto = data; 
        if (data.tienda) this.tienda = data.tienda; 

        // --- SEO & OpenGraph Dinámico ---
        this.titleService.setTitle(`${this.producto.nombre} - SubastaShop`);
        this.metaService.updateTag({ property: 'og:title', content: `${this.producto.nombre} - SubastaShop` });
        this.metaService.updateTag({ property: 'og:description', content: this.producto.descripcion.substring(0, 160) });
        this.metaService.updateTag({ property: 'og:url', content: window.location.href });
        this.metaService.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
        if (this.producto.imagenes && this.producto.imagenes.length > 0) {
          this.metaService.updateTag({ property: 'og:image', content: this.producto.imagenes[0] });
        }
        // --------------------------------

        if (this.producto.tipoVenta === 'RIFA') {
          this.generarNumeros(this.producto.cantidadNumeros);
          this.cargarVendidos();
          if (this.authService.isAdmin()) this.cargarTablaAdmin();
          
          // Mostrar ganadores siempre si la rifa ya terminó
          if (this.producto.estado === 'FINALIZADA' || this.producto.estado === 'VENDIDO') {
            this.cargarGanadoresHistorial();
          }
        }

        this.websocketService.conectar(() => {
          this.websocketService.suscribirseProducto(this.producto.id);
          if (this.producto.tipoVenta === 'RIFA') {
            this.websocketService.suscribirseRifa(this.producto.id);
          }
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
        
        this.cargarCalificaciones(id);
      },
      error: (err) => console.error('Error cargando producto:', err)
    });
  }

  toggleFavorito(productoId: number, event: Event) {
    event.stopPropagation();
    event.preventDefault();
    if (!this.authService.isLoggedIn()) {
      Swal.fire('Inicia Sesión', 'Debes iniciar sesión para agregar a favoritos', 'info');
      return;
    }
    this.favoritoService.toggleFavorito(productoId).subscribe();
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

  // --- CALIFICACIONES ---
  cargarCalificaciones(productoId: number) {
    this.calificacionService.getCalificacionesByProducto(productoId).subscribe({
      next: (data) => {
        this.calificaciones = data;
        if (data.length > 0) {
          const suma = data.reduce((acc, curr) => acc + curr.puntuacion, 0);
          this.promedioCalificacion = suma / data.length;
        }
      }
    });
  }

  enviarCalificacion() {
    if (!this.authService.isLoggedIn()) {
      Swal.fire('Atención', 'Debes iniciar sesión para calificar.', 'warning');
      return;
    }

    if (this.nuevaPuntuacion < 1 || this.nuevaPuntuacion > 5) return;

    Swal.fire({ title: 'Enviando...', didOpen: () => Swal.showLoading() });

    this.calificacionService.crearCalificacion({
      productoId: this.producto.id,
      puntuacion: this.nuevaPuntuacion,
      comentario: this.nuevoComentario
    }).subscribe({
      next: () => {
        Swal.fire('¡Gracias!', 'Tu calificación ha sido guardada.', 'success');
        this.nuevoComentario = '';
        this.cargarCalificaciones(this.producto.id);
      },
      error: (err) => {
        const msg = err.error?.message || err.error || 'No se pudo enviar la calificación.';
        Swal.fire('Error', msg, 'error');
      }
    });
  }

  getStarArray(rating: number): number[] {
    return Array(Math.floor(rating || 0)).fill(0);
  }

  getEmptyStarArray(rating: number): number[] {
    return Array(5 - Math.floor(rating || 0)).fill(0);
  }

  // --- VALIDACIÓN DE DUEÑO ---
  esDuenoProducto(): boolean {
    if (!this.producto) return false;
    const user = this.authService.currentUser();
    if (!user) return false;
    
    // Si es super admin, puede ver todo
    if (user.role === 'ROLE_SUPER_ADMIN') return true;

    // Si es el dueño de la tienda (comparando con el ID del DTO)
    return user.id === this.producto.tiendaUsuarioId;
  }

  ngOnDestroy() {
    this.websocketService.desconectar();
  }
}