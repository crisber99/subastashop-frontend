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
    numero: '',
    nombre: '',
    expiracion: '',
    cvv: ''
  };

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.productService.getOrdenById(Number(id)).subscribe({
        next: (data) => this.orden = data,
        error: (err) => console.error(err)
      });
    }
  }

  confirmarPago() {
    this.procesandoPago = true;
    
    // Simulamos un delay de 2 segundos para dar emoción
    setTimeout(() => {
      if (this.orden) {
        this.productService.pagarOrden(this.orden.id).subscribe({
          next: (resp) => {
            this.procesandoPago = false;
            this.pagoExitoso = true;
          },
          error: (err) => {
            console.error(err);
            this.procesandoPago = false;
            alert('Error en el pago');
          }
        });
      }
    }, 2000);
  }
}