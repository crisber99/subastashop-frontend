import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ProductService } from '../../services/product';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth-service';
import { Websocket } from '../../services/websocket';

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
  websocketService = inject(Websocket);
  authService = inject(AuthService);

  producto: any = null;
  montoOferta: number = 0;
  mensaje: string = '';
  esError: boolean = false;

  // Variables Rifa
  numerosRifa: number[] = [];
  ticketsVendidos: number[] = [];

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
           // Si no lo teníamos marcado como vendido, lo agregamos ahora
           if (!this.ticketsVendidos.includes(num)) {
             this.ticketsVendidos.push(num); 
             // Angular detectará el cambio y pondrá el botón rojo automáticamente
           }
        }

        // OPCIÓN B: ES UNA PUJA (SUBASTA) 🔨
        else if (mensaje.monto) {
          this.producto.precioActual = mensaje.monto; 
          
          // Efecto visual (Parpadeo)
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

        // 1. INICIALIZAR RIFA (Solo si es rifa)
        if (this.producto.tipoVenta === 'RIFA') {
           this.generarNumeros(this.producto.cantidadNumeros);
           this.cargarVendidos();
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
            alert('¡Comprado! 🎉 (Texto recibido)');
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
    this.productService.lanzarRifa(this.producto.id).subscribe(ganadores => {
      console.log(ganadores);
      alert('¡Sorteo realizado! Ganadores: ' + ganadores);
    });
  }

  ngOnDestroy() {
    this.websocketService.desconectar();
  }
}