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
  templateUrl: './product-detail.html', // Asegúrate que el nombre del archivo coincida
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

    // ❌ ELIMINADO DE AQUÍ: La lógica de RIFA y WebSocket estaba causando error
    // porque 'this.producto' todavía era null al iniciar.
    // La moví dentro de 'cargarProducto'.

    // ESCUCHAR ACTUALIZACIONES (Esto sí puede ir aquí, espera eventos pasivamente)
    this.websocketService.obtenerActualizaciones().subscribe((nuevaPuja: any) => {
      console.log("⚡ Actualización en tiempo real recibida:", nuevaPuja);

      if (this.producto && this.producto.id === nuevaPuja.producto.id) {
        this.producto.precioActual = nuevaPuja.monto; 
        
        // Efecto visual
        const badge = document.getElementById('precio-badge');
        if (badge) {
          badge.classList.add('bg-warning');
          setTimeout(() => badge.classList.remove('bg-warning'), 500);
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
      next: () => {
        alert('¡Comprado! 🎉');
        this.cargarVendidos();
      },
      error: (err) => alert('Error: ' + err.error)
    });
  }

  lanzarSorteo() {
    this.productService.lanzarRifa(this.producto.id).subscribe(ganadores => {
      console.log(ganadores);
      alert('¡Sorteo realizado! Revisa la consola o el historial para ver ganadores.');
    });
  }

  ngOnDestroy() {
    this.websocketService.desconectar();
  }
}