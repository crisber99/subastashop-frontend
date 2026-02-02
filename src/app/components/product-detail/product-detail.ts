import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ProductService } from '../../services/product';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth-service';
import { Websocket } from '../../services/websocket';
import { SuperAdminService } from '../../services/super-admin';
import { CartService } from '../../services/cart';
import { Navbar } from '../navbar/navbar';
import { Footer } from '../footer/footer';

declare var bootstrap: any;

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, Navbar, Footer],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.scss',
})
export class ProductDetail implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private productService = inject(ProductService);
  private superAdminService = inject(SuperAdminService);
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
  
  // Variables de Tienda (Nuevas para arreglar el error del HTML)
  productos: any[] = []; // Aunque en detalle usualmente vemos 1, dejamos esto por compatibilidad
  nombreTienda: string = '';
  tienda: any = null; // 👈 Variable necesaria para el color de la tienda

  // Estado visual
  subastaFinalizada: boolean = false;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.cargarProducto(Number(id));
    }

    // ESCUCHAR ACTUALIZACIONES EN TIEMPO REAL ⚡
    this.websocketService.obtenerActualizaciones().subscribe((mensaje: any) => {
      console.log("⚡ Mensaje Socket recibido:", mensaje);

      // Validamos que el mensaje sea para ESTE producto
      if (this.producto && this.producto.id === mensaje.productoId) {

        // OPCIÓN A: ES UN TICKET VENDIDO (RIFA) 🎟️
        if (mensaje.tipo === 'TICKET_VENDIDO') {
          const num = mensaje.numero;
          if (!this.ticketsVendidos.includes(num)) {
            this.ticketsVendidos.push(num);
          }
          if (this.authService.isAdmin()) {
            this.cargarTablaAdmin();
          }
        }

        // 👇 OPCIÓN B: ¡SORTEO FINALIZADO! 🏆 (NUEVO)
        else if (mensaje.tipo === 'SORTEO_FINALIZADO') {
          console.log("🏆 Ganadores recibidos:", mensaje.ganadores);

          // 1. Actualizamos la variable local para que aparezca el Podio HTML
          this.ganadores = mensaje.ganadores;

          // 2. Alert o Scroll suave para llamar la atención
          setTimeout(() => {
            alert('¡Atención! El sorteo ha finalizado. 🎉');
            // Opcional: Recargar producto para bloquear botones de compra si quedaron activos
            this.cargarProducto(this.producto.id);
          }, 500);
        }

        // OPCIÓN C: ES UNA PUJA (SUBASTA) 🔨
        else if (mensaje.monto) {
          this.producto.precioActual = mensaje.monto;
          const badge = document.getElementById('precio-badge');
          if (badge) {
            badge.classList.add('bg-warning');
            setTimeout(() => badge.classList.remove('bg-warning'), 500);
          }
        }
      }
    });
  }

  cargarProducto(id: number) {
    this.productService.getProductoById(id).subscribe({
      next: (data) => {
        this.producto = data; // ✅ AQUÍ ya tenemos datos

        if (data.tienda) {
            this.tienda = data.tienda; // Aquí guardamos los datos bancarios que vienen de Java
        }

        // 1. INICIALIZAR RIFA (Solo si es rifa)
        if (this.producto.tipoVenta === 'RIFA') {
          this.generarNumeros(this.producto.cantidadNumeros);
          this.cargarVendidos();
          if (this.authService.isAdmin()) {
            this.cargarTablaAdmin();
          }
          if (this.producto.estado === 'FINALIZADA' || this.producto.estado === 'VENDIDO') {
            this.cargarGanadoresHistorial();
          }
        }

        // 2. CONECTAR WEBSOCKET (Ahora que tenemos ID seguro)
        this.websocketService.conectar(() => {
          this.websocketService.suscribirseProducto(this.producto.id);
        });

        // 3. LÓGICA DE SUBASTA (Validación de fechas)
        if (data.tipoVenta === 'SUBASTA' && data.fechaFinSubasta) {
          const fechaFin = new Date(data.fechaFinSubasta);
          const ahora = new Date();

          if (fechaFin < ahora) {
            this.subastaFinalizada = true;
            this.mensaje = 'Esta subasta ha finalizado.';
            this.esError = true;
          } else {
            this.subastaFinalizada = false;
            // Sugerir monto
            this.montoOferta = (data.precioActual || data.precioBase) + 1000;
          }
        }
      },
      error: (err) => console.error('Error cargando producto:', err)
    });
  }

  // --- MÉTODOS DE SUBASTA ---
  pujar() {
    if (!this.producto || this.subastaFinalizada) return;

    this.productService.realizarPuja(this.producto.id, this.montoOferta).subscribe({
      next: (resp) => {
        this.mensaje = '¡Oferta realizada con éxito!';
        this.esError = false;
        this.cargarProducto(this.producto.id); // Recargar para ver cambios
      },
      error: (err) => {
        this.mensaje = err.error || 'Error al realizar la puja';
        this.esError = true;
      }
    });
  }

  agregarAlCarrito() {
    this.cartService.agregarItem(this.producto, 'DIRECTA');
  }

  cargarTablaAdmin() {
    this.productService.getDetallesRifaAdmin(this.producto.id).subscribe(data => {
      this.ticketsDetalle = data.sort((a: any, b: any) => a.numero - b.numero);
    });
  }

  cargarGanadoresHistorial() {
    this.productService.getGanadoresRifa(this.producto.id).subscribe({
      next: (data) => {
        // Si data existe y tiene longitud, asignamos. Si no, array vacío.
        if (data && data.length > 0) {
          this.ganadores = data;
          console.log("Historial de ganadores cargado:", this.ganadores);
        } else {
          this.ganadores = [];
        }
      },
      error: (err) => {
        // Es normal que de error 404 si aun no hay ganadores (depende de tu backend)
        // Lo ignoramos silenciosamente o seteamos vacío
        this.ganadores = [];
      }
    });
  }

  // --- MÉTODOS DE RIFA ---
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
    if (!confirm(`¿Comprar el número ${num}?`)) return;

    this.productService.comprarTicket(this.producto.id, num).subscribe({
      next: (resp) => {
        // ÉXITO REAL
        alert('¡Comprado! 🎉');
        this.cargarVendidos();
      },
      error: (err) => {
        // MANEJO INTELIGENTE DE ERRORES
        console.error("Detalle del error:", err);

        // Si el status es 200 (OK) pero cayó aquí, es el error de Parseo (Texto vs JSON)
        // Significa que SÍ funcionó.
        if (err.status === 200) {
          alert('¡Comprado! 🎉');
          this.cargarVendidos();
          return;
        }

        // Si es otro error, mostramos el mensaje real convirtiendo el objeto a texto
        const mensajeError = err.error ? JSON.stringify(err.error) : 'Error desconocido';
        alert('Ocurrió un error: ' + mensajeError);
      }
    });
  }

  lanzarSorteo() {
    this.productService.lanzarRifa(this.producto.id).subscribe({
      next: (listaGanadores: any) => {
        this.ganadores = listaGanadores;

        // Construimos un mensaje de texto legible
        let mensaje = '🏆 ¡GANADORES SELECCIONADOS! 🏆\n\n';
        listaGanadores.forEach((g: any, index: number) => {
          const comprador = g.comprador?.email || g.comprador || 'Anónimo';
          mensaje += `${index + 1}º Lugar: Ticket #${g.numeroTicket} - ${comprador}\n`;
        });

        alert(mensaje);

        this.cargarProducto(this.producto.id);
      },
      error: (err) => {
        console.error('Error desde backend:', err);
        const mensajeServidor = err.error;

        if (typeof mensajeServidor === 'string') {
          alert('⚠️ Aviso: ' + mensajeServidor);
        } else {
          alert('❌ Ocurrió un error inesperado. Revisa la consola.');
        }
      }
    });
  }

  reportarProducto() {
    if (!this.producto) return; 

    const motivo = prompt("¿Por qué quieres reportar este producto? (Ej: Fraude, Ilegal)");

    if (motivo) {
      this.superAdminService.reportarProducto(this.producto.id, motivo).subscribe({
        next: () => alert("✅ Gracias. Hemos recibido tu reporte y lo revisaremos."),
        error: (err) => {
          console.error(err);
          alert("❌ Error al enviar el reporte. Intenta nuevamente.");
        }
      });
    }
  }

  abrirModalPago() {
    const modalElement = document.getElementById('modalPago');
    if (modalElement) {
      const modal = new bootstrap.Modal(modalElement);
      modal.show();
    } else {
      console.error('El modal no se encuentra en el HTML');
    }
  }

  ngOnDestroy() {
    this.websocketService.desconectar();
  }
}