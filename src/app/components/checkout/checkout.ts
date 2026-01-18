import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ProductService } from '../../services/product';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
})
export class Checkout implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productService = inject(ProductService);

  orden: any = null;
  cargando = false;
  procesandoPago = false;
  pagoExitoso = false;

  // Datos simulados de tarjeta
  datosTarjeta = {
    nombre: '',
    numeroTarjeta: '',
    expiracion: '',
    cvv: ''
  };

  ngOnInit() {
    // Obtener ID de la URL
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.cargarOrden(Number(id));
    }
  }

  cargarOrden(id: number) {
    this.productService.getOrdenById(id).subscribe({
      next: (data) => {
        this.orden = data;
        this.cargando = false;
      },
      error: () => {
        alert('Error al cargar la orden');
        this.router.navigate(['/mi-cuenta']);
      }
    });
  }

  confirmarPago() {
    this.procesandoPago = true;
    
    // Simulamos un pequeño delay para dar realismo
    setTimeout(() => {
        this.productService.pagarOrden(this.orden.id, this.datosTarjeta).subscribe({
          next: () => {
            alert('¡Pago realizado con éxito! 🥳');
            this.router.navigate(['/mi-cuenta']); // Volver al perfil
          },
          error: () => {
            alert('Error al procesar el pago');
            this.procesandoPago = false;
          }
        });
    }, 1500);
  }
}