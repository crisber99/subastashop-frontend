import { Component, inject, OnInit } from '@angular/core';
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
export class ProductDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private productService = inject(ProductService);
  websocketService = inject(Websocket);

  authService = inject(AuthService);

  producto: any = null;
  montoOferta: number = 0;
  mensaje: string = '';
  esError: boolean = false;
  
  // Variable para controlar el estado visual
  subastaFinalizada: boolean = false; 

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.cargarProducto(Number(id));
    }

    this.websocketService.conectar(() => {
      
      // Esta línea solo se ejecuta cuando ya estamos conectados ✅
      if (this.producto) {
        this.websocketService.suscribirseProducto(this.producto.id);
      }
      
    });

    // ESCUCHAR ACTUALIZACIONES (Igual que antes)
    this.websocketService.obtenerActualizaciones().subscribe((nuevaPuja: any) => {
      console.log("⚡ Actualización en tiempo real recibida:", nuevaPuja);
      
      if (this.producto && this.producto.id === nuevaPuja.producto.id) {
        this.producto.precioActual = nuevaPuja.monto; // ¡Aquí ocurre la magia!
        
        // Efecto visual (opcional)
        const badge = document.getElementById('precio-badge');
        if(badge) {
             badge.classList.add('bg-warning'); // Parpadeo amarillo
             setTimeout(() => badge.classList.remove('bg-warning'), 500);
        }
      }
    });
  }

  cargarProducto(id: number) {
    this.productService.getProductoById(id).subscribe({
      next: (data) => {
        this.producto = data;
        
        // --- LÓGICA DE VALIDACIÓN VISUAL ---
        if (data.tipoVenta === 'SUBASTA' && data.fechaFinSubasta) {
          const fechaFin = new Date(data.fechaFinSubasta);
          const ahora = new Date(); // Toma la hora de tu navegador
          
          // Si la fecha de fin es menor a ahora, bloqueamos
          if (fechaFin < ahora) {
            this.subastaFinalizada = true;
            this.mensaje = 'Esta subasta ha finalizado.';
            this.esError = true; // Lo marcamos como alerta visual
          } else {
            this.subastaFinalizada = false;
            // Sugerir monto
            this.montoOferta = (data.precioActual || data.precioBase) + 1000;
          }
        }
      },
      error: (err) => console.error(err)
    });
  }

  pujar() {
    if (!this.producto || this.subastaFinalizada) return; // Doble protección

    this.productService.realizarPuja(this.producto.id, this.montoOferta).subscribe({
      next: (resp) => {
        this.mensaje = '¡Oferta realizada con éxito!';
        this.esError = false;
        this.cargarProducto(this.producto.id);
      },
      error: (err) => {
        // Si el backend nos rechaza (ej: por milisegundos), mostramos el error bonito
        this.mensaje = err.error || 'Error al realizar la puja';
        this.esError = true;
      }
    });
  }

  ngOnDestroy() {
    this.websocketService.desconectar(); // Limpiar al salir
  }
}