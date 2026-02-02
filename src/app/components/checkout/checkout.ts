import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { OrdenService } from '../../services/orden';
@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
})
export class Checkout implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private ordenService = inject(OrdenService);

  ordenId: number = 0;
  orden: any = null;
  loading = false;
  archivoComprobante: File | null = null;
  intentoEnviar = false;

  ngOnInit() {
    this.ordenId = Number(this.route.snapshot.paramMap.get('id'));
    this.cargarOrden();
  }

  cargarOrden() {
    this.ordenService.getOrdenById(this.ordenId).subscribe({
      next: (data) => {
        this.orden = data;
        // La orden ya viene del backend con el TOTAL calculado y la lista de detalles
        // gracias a que arreglamos el controlador antes.
      },
      error: (err) => alert('Error al cargar la orden')
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.archivoComprobante = file;
      this.intentoEnviar = false; // Reseteamos el error visual
    }
  }

  confirmarTransferencia() {
    this.intentoEnviar = true;

    // 1. Validación de seguridad (aunque el botón esté disabled)
    if (!this.archivoComprobante) {
      alert("⚠️ Por favor sube el comprobante de pago.");
      return;
    }

    this.loading = true;

    // 2. Aquí llamarías a tu servicio para subir el archivo
    // this.ordenService.subirComprobante(this.orden.id, this.archivoComprobante)...

    // Simulación por ahora:
    console.log("Enviando archivo:", this.archivoComprobante.name);

    setTimeout(() => {
      alert('🚀 ¡Comprobante recibido! El vendedor validará tu pago.');
      this.router.navigate(['/dashboard']);
      this.loading = false;
    }, 1500);
  }
}