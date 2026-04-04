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
import { OrdenService } from '../../services/orden';
import { Router } from '@angular/router';
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
  ordenService = inject(OrdenService);
  router = inject(Router);
  
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
  misTickets: any[] = [];
  comprobante: any = null;
  
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
  procesandoCompra: boolean = false;

  // Calificaciones
  calificaciones: any[] = [];
  nuevaPuntuacion: number = 5;
  nuevoComentario: string = '';
  promedioCalificacion: number = 0;

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.favoritoService.cargarIdsFavoritos();
    }

    const slug = this.route.snapshot.paramMap.get('slug');
    if (slug) {
      this.cargarProducto(slug);
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
          this.cargarProducto(this.producto.slug || this.producto.id);
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
    this.cargarProducto(this.producto.slug || this.producto.id);
  }

  cargarProducto(idOrSlug: any) {
    const obs = (typeof idOrSlug === 'string') 
      ? this.productService.getProductoBySlug(idOrSlug)
      : this.productService.getProductoById(idOrSlug);

    obs.subscribe({
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
          if (this.authService.isLoggedIn()) this.cargarMisTickets();
          
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
        
        this.cargarCalificaciones(data.id);
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
        this.cargarProducto(this.producto.slug || this.producto.id); 
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

  async comprarAhora() {
    if (!this.authService.isLoggedIn()) {
      Swal.fire({
        title: 'Inicia Sesión',
        text: 'Debes estar registrado para realizar una compra.',
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: 'Ir a Login',
        cancelButtonText: 'Cancelar'
      }).then(r => { if(r.isConfirmed) this.router.navigate(['/login']); });
      return;
    }

    // 1. Obtener opciones de envío de la tienda
    let preferenciaEnvio = '';
    const opciones = this.producto.tienda?.opcionesEnvio;
    
    if (opciones && opciones.trim().length > 0) {
      const listaOpciones = opciones.split(',').map((o: string) => o.trim());
      const inputOptions: any = {};
      listaOpciones.forEach((o: string) => inputOptions[o] = o);

      const { value: seleccion } = await Swal.fire({
        title: 'Selecciona método de envío 🚚',
        input: 'select',
        inputOptions: inputOptions,
        inputPlaceholder: 'Elige una opción...',
        showCancelButton: true,
        confirmButtonText: 'Continuar',
        cancelButtonText: 'Cancelar',
        inputValidator: (value) => {
          return new Promise((resolve) => {
            if (value) resolve(null);
            else resolve('Debes seleccionar una opción de envío');
          });
        }
      });

      if (!seleccion) return; // Canceló
      preferenciaEnvio = seleccion;
    }

    Swal.fire({
      title: 'Procesando compra...',
      text: 'Estamos generando o recuperando tu orden de pedido',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    // 2. Creamos el objeto de orden (Corrección: tipoCompra)
    const orderRequest = {
      detalles: [{
        productoId: this.producto.id,
        cantidad: 1,
        precioUnitario: this.producto.precioBase,
        tipoCompra: 'DIRECTA' // Corregido de tipoVenta
      }],
      preferenciaEnvio: preferenciaEnvio
    };

    this.ordenService.crearOrden(orderRequest).subscribe({
      next: (orden: any) => {
        Swal.close();
        
        // Parsear cuentas bancarias
        let cuentasHtml = '';
        try {
          const datos = this.producto.tienda?.datosBancarios;
          if (datos && datos.startsWith('[')) {
            const cuentas = JSON.parse(datos);
            cuentasHtml = cuentas.map((c: any) => `
              <div class="payment-info-box" style="text-align: left; padding: 10px; border-radius: 10px; margin-bottom: 15px;">
                <p style="margin: 0; font-weight: bold; color: #818cf8;">${c.banco} - ${c.tipo}</p>
                <div style="margin-top: 5px; opacity: 0.9;">
                  <p style="margin: 0; font-size: 0.9em;">N°: <b>${c.numero}</b></p>
                  <p style="margin: 0; font-size: 0.9em;">Titular: ${c.titular}</p>
                  <p style="margin: 0; font-size: 0.9em;">RUT: ${c.rut}</p>
                </div>
              </div>
            `).join('');
          } else {
            cuentasHtml = `<div class="payment-info-box" style="text-align: left; white-space: pre-line;">${datos || 'Contactar al vendedor'}</div>`;
          }
        } catch (e) {
          cuentasHtml = `<p>Error al cargar cuentas. Ver detalle en checkout.</p>`;
        }

        const envioInfo = preferenciaEnvio ? `<p class="badge bg-primary mb-2">Envío: ${preferenciaEnvio}</p>` : '';

        Swal.fire({
          title: '¡Orden Reservada! 🎉',
          html: `
            <p>Tu orden <b>#${orden.id}</b> ha sido gestionada con éxito.</p>
            ${envioInfo}
            <p class="small opacity-75 mb-3">Realiza la transferencia por <b>$${this.producto.precioBase.toLocaleString()}</b>:</p>
            <div style="max-height: 250px; overflow-y: auto; padding: 5px;">${cuentasHtml}</div>
            <div class="mt-3 p-2 bg-info-subtle border rounded small" style="color: #0c5460;">
              💡 Una vez realizada la transferencia, sube tu comprobante para que el vendedor valide el pago.
            </div>
          `,
          icon: 'success',
          showCancelButton: true,
          confirmButtonText: '🚀 Informar Pago Ahora',
          cancelButtonText: 'Ver mis órdenes',
          confirmButtonColor: '#6366f1'
        }).then(res => {
          if (res.isConfirmed) {
            this.router.navigate(['/checkout', orden.id]);
          } else {
            this.router.navigate(['/dashboard'], { queryParams: { tab: 'compras' } });
          }
        });
      },
      error: (err) => {
        Swal.close();
        Swal.fire('Error', err.error?.message || 'No se pudo procesar la compra inmediata.', 'error');
      }
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

  cargarMisTickets() {
    this.productService.getMisTickets(this.producto.id).subscribe({
      next: (data) => this.misTickets = data || [],
      error: () => this.misTickets = []
    });
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
    if (!this.authService.isLoggedIn()) {
      Swal.fire('Inicia Sesión', 'Debes iniciar sesión para comprar un ticket.', 'info');
      return;
    }
    Swal.fire({
        title: `¿Comprar el #${num}?`,
        html: `<p>El precio es <b>$${this.producto.precioTicket?.toLocaleString()}</b></p><p class="text-muted small">Recibirás un comprobante por email.</p>`,
        icon: 'question', showCancelButton: true, confirmButtonText: 'Sí, comprar 🎟️', cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            Swal.fire({ title: 'Procesando...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
            this.productService.comprarTicket(this.producto.id, num).subscribe({
                next: (resp: any) => {
                  Swal.close();
                  this.comprobante = resp;
                  this.cargarVendidos();
                  this.cargarMisTickets();
                  // Mostrar modal de comprobante
                  const modalEl = document.getElementById('modalComprobante');
                  if (modalEl) {
                    const modal = new (window as any).bootstrap.Modal(modalEl);
                    modal.show();
                  }
                },
                error: (err) => {
                  Swal.close();
                  const errorMsg = err.error?.message || err.error || 'No se pudo comprar el ticket';
                  Swal.fire('Error', errorMsg, 'error');
                }
            });
        }
    });
  }

  // --- SELECCIÓN MÚLTIPLE DE TICKETS ---
  ticketsSeleccionados: number[] = [];

  isTicketSeleccionado(num: number): boolean {
    return this.ticketsSeleccionados.includes(num);
  }

  toggleSeleccion(num: number) {
    if (!this.authService.isLoggedIn()) {
      Swal.fire('Inicia Sesión', 'Debes iniciar sesión para comprar tickets.', 'info');
      return;
    }
    if (this.isTicketSeleccionado(num)) {
      this.ticketsSeleccionados = this.ticketsSeleccionados.filter(n => n !== num);
    } else {
      this.ticketsSeleccionados.push(num);
    }
  }

  limpiarSeleccion() {
    this.ticketsSeleccionados = [];
  }

  async comprarSeleccionados() {
    if (this.ticketsSeleccionados.length === 0) return;

    const total = this.ticketsSeleccionados.length * (this.producto.precioTicket || 0);
    const confirmacion = await Swal.fire({
      title: `¿Comprar ${this.ticketsSeleccionados.length} ticket(s)?`,
      html: `<p>Tickets: <b>${this.ticketsSeleccionados.map(n => '#' + n).join(', ')}</b></p>
             <p>Total: <b class="text-warning">$${total.toLocaleString()}</b></p>
             <p class="text-muted small">Recibirás un comprobante por email.</p>`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: '🎟️ Confirmar Compra',
      cancelButtonText: 'Cancelar'
    });

    if (!confirmacion.isConfirmed) return;

    Swal.fire({ title: 'Procesando...', html: 'Reservando tus tickets...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    this.procesandoCompra = true;

    this.productService.comprarTicketsMultiple(this.producto.id, this.ticketsSeleccionados).subscribe({
      next: (resp: any) => {
        this.procesandoCompra = false;
        Swal.close();
        this.comprobante = { ...resp, tickets: this.ticketsSeleccionados };
        this.cargarVendidos();
        this.cargarMisTickets();
        this.limpiarSeleccion();
        
        const modalEl = document.getElementById('modalComprobante');
        if (modalEl) new (window as any).bootstrap.Modal(modalEl).show();

        if (resp.omitidos && resp.omitidos.length > 0) {
          Swal.fire({ 
            icon: 'warning', 
            title: 'Algunos tickets no estaban disponibles', 
            text: `Se compraron ${resp.comprados.length}. Los números ${resp.omitidos.join(', ')} ya estaban ocupados.`,
            timer: 4000, 
            showConfirmButton: false 
          });
        }
      },
      error: (err) => {
        this.procesandoCompra = false;
        Swal.close();
        const msg = err.error?.message || err.error || 'Error al procesar la compra';
        Swal.fire('Error', msg, 'error');
      }
    });
  }

  imprimirComprobante() {
    this.imprimirTicket(this.comprobante);
  }

  imprimirTicket(t: any) {
    const tickets = t.tickets || [t.numeroTicket];
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html lang="es"><head>
      <meta charset="UTF-8"><title>Comprobante SubastaShop</title>
      <style>
        body { font-family: Arial, sans-serif; background: #0f0f1a; color: #fff; margin: 0; padding: 30px; }
        .card { background: #1a1a2e; border-radius: 20px; padding: 30px; max-width: 560px; margin: auto; }
        .header { background: linear-gradient(135deg, #6f42c1, #0d6efd); border-radius: 14px; padding: 20px; text-align: center; margin-bottom: 24px; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 900; }
        .ticket-grid { display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; margin-bottom: 20px; }
        .ticket-item { background: linear-gradient(135deg, #6f42c1, #0d6efd); border-radius: 10px; padding: 12px 20px; text-align: center; }
        .ticket-item .num { font-size: 2rem; font-weight: 900; }
        .code { background: #0a0a14; border: 1px dashed rgba(255,193,7,0.4); border-radius: 10px; padding: 12px; text-align: center; margin-bottom: 20px; }
        .code p { color: #ffc107; font-family: monospace; font-size: 1.1rem; font-weight: 700; letter-spacing: 3px; margin: 0; }
        .label { color: #a0a0c0; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; }
        @media print { body { background: white; color: #000; } .header { color: white; } }
      </style></head><body>
      <div class="card">
        <div class="header"><h1>🎟️ SUBASTA<span style="color:#ffc107">SHOP</span></h1><p style="margin:4px 0 0;opacity:.8;font-size:13px">COMPROBANTE OFICIAL</p></div>
        <div class="ticket-grid">${tickets.map((n: number) => `<div class="ticket-item"><div class="label">TICKET</div><div class="num">#${n}</div></div>`).join('')}</div>
        <div style="margin-bottom:16px"><span class="label">Rifa</span><p style="margin:4px 0 0;font-size:16px;font-weight:700">${t.nombreRifa || this.producto?.nombre}</p></div>
        <div style="margin-bottom:16px"><span class="label">Comprador</span><p style="margin:4px 0 0">${t.comprador}</p></div>
        <div class="code"><p class="label" style="margin-bottom:6px">Código de Verificación</p><p>${t.codigoVerificacion}</p></div>
        <p style="font-size:12px;color:#606080;text-align:center">Comprobante generado por SubastaShop. No requiere firma.</p>
      </div>
      <script>window.print(); window.onafterprint = () => window.close();<\/script></body></html>`);
    w.document.close();
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
                  this.cargarProducto(this.producto.slug || this.producto.id);
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