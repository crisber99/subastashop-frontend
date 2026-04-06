import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule, AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Meta, Title } from '@angular/platform-browser';
import { ProductService } from '../../services/product';
import { LegalTermsComponent } from '../legal-terms/legal-terms';
import { AuthService } from '../../services/auth-service';
import { Websocket } from '../../services/websocket';
import { SuperAdminService } from '../../services/super-admin';
import { CartService } from '../../services/cart';
import { LayoutService } from '../../services/layout';
import { CalificacionService } from '../../services/calificacion';
import { FavoritoService } from '../../services/favorito.service';
import { OrdenService } from '../../services/orden';
import { ChatService } from '../../services/chat';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

declare var bootstrap: any;
import confetti from 'canvas-confetti';

import { MemoriceComponent } from '../memorice/memorice';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, AsyncPipe, FormsModule, RouterModule, MemoriceComponent, LegalTermsComponent],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.scss',
})
export class ProductDetail implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private productService = inject(ProductService);
  private superAdminService = inject(SuperAdminService);
  public layoutService = inject(LayoutService);
  public cartService = inject(CartService);
  public ordenService = inject(OrdenService);
  public chatService = inject(ChatService);
  public router = inject(Router);
  
  public websocketService = inject(Websocket);
  public authService = inject(AuthService);
  public calificacionService = inject(CalificacionService);
  public favoritoService = inject(FavoritoService);
  
  titleService = inject(Title);
  metaService = inject(Meta);

  producto: any = null;
  montoOferta: number = 0;
  mensaje: string = '';
  esError: boolean = false;
  tiendaSlug: string | null = null;

  // ⚖️ LEGAL TERMS
  legalTermsChecked: boolean = false;
  legalAcceptedOnBackend: boolean = false;

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
  
  // Variables Sniper Bot 🤖
  sniperActivo: any = null;
  loadingSniper: boolean = false;

  // Estado visual
  subastaFinalizada: boolean = false;
  isLive: boolean = false;
  procesandoCompra: boolean = false;
  periodoSubasta: 'ANUNCIO' | 'PREVIA_PRO' | 'ABIERTA' | 'FINALIZADA' = 'ABIERTA';
  fechaInicioVisible: Date | null = null;
  fechaProVisible: Date | null = null;

  // Calificaciones
  calificaciones: any[] = [];
  nuevaPuntuacion: number = 5;
  nuevoComentario: string = '';
  promedioCalificacion: number = 0;

  // CHAT
  nuevoMensajeChat: string = '';

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
          this.cargarMisParticipaciones();
          this.cargarGanadoresHistorial();
          
          if (this.authService.isAdmin()) {
            this.cargarTablaAdmin();
          }
        }

        this.websocketService.conectar(() => {
          this.websocketService.suscribirseProducto(this.producto.id);
          if (this.producto.tipoVenta === 'RIFA') {
            this.websocketService.suscribirseRifa(this.producto.id);
          }
        });

        if (data.tipoVenta === 'SUBASTA') {
          const ahora = new Date();
          const fechaFin = data.fechaFinSubasta ? new Date(data.fechaFinSubasta) : null;
          const inicioOficial = data.fechaInicioSubasta ? new Date(data.fechaInicioSubasta) : new Date(data.fechaCreacion);
          const horasAnticipo = data.horasVentaAnticipada || 24;
          const inicioPro = new Date(inicioOficial.getTime() - (horasAnticipo * 60 * 60 * 1000));

          if (fechaFin && ahora > fechaFin) {
            this.subastaFinalizada = true;
            this.mensaje = 'Esta subasta ha finalizado.';
            this.esError = true;
            this.periodoSubasta = 'FINALIZADA';
          } else if (ahora < inicioPro) {
            this.periodoSubasta = 'ANUNCIO'; // No abierta para nadie
            this.subastaFinalizada = false;
          } else if (ahora < inicioOficial) {
            this.periodoSubasta = 'PREVIA_PRO'; // Solo PRO
            this.subastaFinalizada = false;
            this.montoOferta = (data.precioActual || data.precioBase) + 1000;
          } else {
            this.periodoSubasta = 'ABIERTA'; // Todo el mundo
            this.subastaFinalizada = false;
            this.montoOferta = (data.precioActual || data.precioBase) + 1000;
          }
          
          this.fechaInicioVisible = inicioOficial;
          this.fechaProVisible = inicioPro;
        }
        
        // --- DEBUG CHAT ---
        console.log('📦 Product Data received:', data);
        const tId = data.tiendaId || (data.tienda ? data.tienda.id : null);
        console.log('🆔 Tienda ID detectado para chat:', tId);

        if (data.id) {
          this.chatService.initChat(data.id);
        } else {
          console.error('🚫 No se detectó producto.id para iniciar el chat.', data);
        }

        if (this.authService.isLoggedIn() && data.tipoVenta === 'SUBASTA') {
          this.cargarSniper(data.id);
        }

        this.cargarCalificaciones(data.id);
      },
      error: (err) => console.error('Error cargando producto:', err)
    });
  }

  cargarSniper(productoId: number) {
    if (!this.authService.isLoggedIn()) return;
    this.productService.obtenerSniper(productoId).subscribe({
      next: (data) => this.sniperActivo = data,
      error: () => this.sniperActivo = null
    });
  }

  async configurarSniper() {
    const user = this.authService.currentUser();
    // Validar si es PRO (suponiendo que 'esPro' o 'suscripcionActiva' está en el objeto de usuario)
    if (!user?.suscripcionActiva && !user?.pagoAutomatico) {
        Swal.fire({
            title: '⭐ Función PRO',
            text: 'El Sniper Bot es una función exclusiva para miembros PRO. ¡Suscríbete para automatizar tus pujas!',
            icon: 'info',
            showCancelButton: true,
            confirmButtonText: 'Ver Planes PRO',
            cancelButtonText: 'Cerrar'
        }).then(r => { if(r.isConfirmed) this.router.navigate(['/admin/configuracion']); });
        return;
    }

    const { value: monto } = await Swal.fire({
      title: '🤖 Configurar Sniper Bot',
      html: `
        <p class="text-muted small">El bot pujará un <b>1%</b> extra automáticamente cada vez que alguien te supere.</p>
        <label class="form-label fw-bold">Monto Máximo a Pujar ($):</label>
      `,
      input: 'number',
      inputAttributes: { min: (this.producto.precioActual || this.producto.precioBase).toString(), step: '100' },
      inputValue: (this.producto.precioActual || this.producto.precioBase) + 5000,
      showCancelButton: true,
      confirmButtonText: '🚀 Activar Bot',
      cancelButtonText: 'Cancelar',
      inputValidator: (value) => {
        if (!value || Number(value) <= (this.producto.precioActual || this.producto.precioBase)) {
          return 'El monto máximo debe ser superior al precio actual.';
        }
        return null;
      }
    });

    if (monto) {
      this.productService.configurarSniper(this.producto.id, Number(monto)).subscribe({
        next: (res) => {
          this.sniperActivo = res;
          Swal.fire({
            icon: 'success',
            title: '¡Bot Activado!',
            text: `Pujaremos por ti hasta un máximo de $${Number(monto).toLocaleString()}`,
            timer: 3000,
            toast: true,
            position: 'top-end',
            showConfirmButton: false
          });
        },
        error: (err) => {
          Swal.fire('Error', err.error?.message || 'No se pudo activar el bot.', 'error');
        }
      });
    }
  }

  desactivarSniper() {
    if (!this.sniperActivo) return;
    
    // Podríamos crear un endpoint DELETE, pero por ahora lo desactivamos 
    // pasando un monto 0 o simplemente con un endpoint dedicado.
    // Usaremos el mismo configurarSniper pero con el flag activo=false si el backend lo soporta, 
    // o simplemente creamos el endpoint ahora.
    
    Swal.fire({
      title: '¿Desactivar Sniper?',
      text: 'El bot dejará de pujar automáticamente por este producto.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, desactivar',
      cancelButtonText: 'Mantener activo'
    }).then(r => {
      if (r.isConfirmed) {
        this.productService.desactivarSniper(this.producto.id).subscribe({
          next: () => {
            this.sniperActivo = null;
            Swal.fire({
              icon: 'success',
              title: 'Sniper Desactivado',
              text: 'El bot ya no realizará pujas por ti.',
              timer: 2000,
              toast: true,
              position: 'top-end',
              showConfirmButton: false
            });
          },
          error: (err) => {
            Swal.fire('Error', 'No se pudo desactivar el bot.', 'error');
          }
        });
      }
    });
  }

  // --- LOGICA DE CHAT EN VIVO ---
  enviarMensajeChat() {
    if (!this.nuevoMensajeChat.trim()) return;
    if (!this.authService.isLoggedIn()) {
      Swal.fire('Inicia Sesión', 'Debes estar logueado para enviar mensajes al chat en vivo.', 'warning');
      return;
    }
    
    const user = this.authService.currentUser();
    const email = user?.email || '';
    const nombreRemitente = user?.alias || user?.nombre || 'Usuario';
    
    const tId = this.producto.tiendaId || (this.producto.tienda ? this.producto.tienda.id : null);
    
    // El ChatService ahora usa productoId desde el initChat, pasamos tId opcionalmente
    this.chatService.enviarMensaje(nombreRemitente, this.nuevoMensajeChat, email, tId);
    this.nuevoMensajeChat = '';
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

  cargarMisParticipaciones() {
    if (!this.authService.isLoggedIn()) return;
    this.productService.getMisParticipaciones(this.producto.id).subscribe({
      next: (data) => this.misTickets = data || [],
      error: () => this.misTickets = []
    });
  }

  yaParticipa(): boolean {
    return this.misTickets && this.misTickets.length > 0;
  }

  haPagado(): boolean {
    // Para simplificar esta versión, si tiene participación asumimos que puede jugar.
    // En una versión más estricta, validaríamos el campo 'pagado'.
    return this.yaParticipa();
  }

  unirseAlConcurso() {
    if (!this.authService.isLoggedIn()) {
      Swal.fire('Inicia Sesión', 'Debes iniciar sesión para participar.', 'info');
      return;
    }

    if (!this.legalTermsChecked) {
      Swal.fire('Gestión Legal', 'Debes leer y aceptar las bases legales antes de participar.', 'warning');
      return;
    }

    // Primero enviamos la aceptación al backend (Auditoría Forense)
    this.productService.acceptLegalTerms('CONTEST_JOIN').subscribe({
      next: () => {
        // Enviar inscripción al backend
        this.productService.unirseAlConcurso(this.producto.id).subscribe({
          next: () => {
            this.cargarMisParticipaciones();
            Swal.fire({
              title: '¡Inscrito!',
              text: 'Ya puedes participar en el concurso de habilidad.',
              icon: 'success',
              confirmButtonText: 'Cerrar'
            });
          },
          error: (err) => {
            console.error('Error al unirse al concurso', err);
            const msg = err.error || 'Ocurrió un problema.';
            Swal.fire('Error', msg, 'error');
          }
        });
      },
      error: (err) => {
        Swal.fire('Error Legal', 'No pudimos registrar tu aceptación de bases. Reintenta.', 'error');
      }
    });
  }

  onGameComplete(time: number) {
    console.log('🎮 Juego completado en:', time, 'ms');
    this.cargarGanadoresHistorial(); // Refrescar tabla de líderes
  }

  lanzarConcurso() {
    Swal.fire({
      title: '¿Determinar Ganadores?',
      text: 'Se cerrará el concurso y se asignarán los puestos según los mejores tiempos registrados.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, finalizar y premiar 🏆',
      cancelButtonText: 'Cancelar'
    }).then((res) => {
      if (res.isConfirmed) {
        Swal.fire({ title: 'Procesando...', didOpen: () => Swal.showLoading() });
        this.productService.lanzarConcurso(this.producto.id).subscribe({
          next: () => {
            Swal.close();
            Swal.fire('¡Concurso Finalizado!', 'Los ganadores han sido determinados por sus tiempos.', 'success');
            this.cargarProducto(this.producto.slug || this.producto.id);
          },
          error: (err) => {
            Swal.close();
            Swal.fire('Error', 'Hubo un problema al finalizar el concurso.', 'error');
          }
        });
      }
    });
  }

  cargarTablaAdmin() {
    this.productService.getParticipacionesAdmin(this.producto.id).subscribe(data => {
      this.ticketsDetalle = data;
    });
  }

  cargarGanadoresHistorial() {
    this.productService.getGanadoresConcurso(this.producto.id).subscribe({
      next: (data) => {
        this.ganadores = data || [];
      },
      error: () => this.ganadores = []
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
    this.chatService.desconectar();
  }
}