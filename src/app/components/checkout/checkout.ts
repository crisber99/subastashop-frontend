import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { OrdenService } from '../../services/orden';
import Swal from 'sweetalert2'; // 👈 Importar

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
  private OrdenService = inject(OrdenService);

  ordenId: number = 0;
  orden: any = null;
  cuentasBancarias: any[] = [];
  legacyDatos: string = '';
  loading = false;
  archivoComprobante: File | null = null;
  intentoEnviar = false;

  ngOnInit() {
    this.ordenId = Number(this.route.snapshot.paramMap.get('id'));
    this.cargarOrden();
  }

  cargarOrden() {
    Swal.fire({title: 'Cargando...', allowOutsideClick: false, didOpen: () => Swal.showLoading()});
    
    this.OrdenService.getOrdenById(this.ordenId).subscribe({
      next: (data) => {
        this.orden = data;
        
        // Parsear cuentas bancarias
        try {
          const datos = data.tienda?.datosBancarios;
          if (datos && datos.startsWith('[')) {
            this.cuentasBancarias = JSON.parse(datos);
          } else {
            this.legacyDatos = datos || '';
          }
        } catch (e) {
          this.legacyDatos = data.tienda?.datosBancarios || '';
        }

        Swal.close();
      },
      error: (err) => {
        Swal.fire('Error', 'No se pudo cargar la información de la orden', 'error');
        this.router.navigate(['/dashboard']);
      }
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.archivoComprobante = file;
      this.intentoEnviar = false; 
    }
  }

  confirmarTransferencia() {
    this.intentoEnviar = true;

    if (!this.archivoComprobante) {
      Swal.fire('Falta Comprobante', 'Por favor sube la foto o captura del pago.', 'warning');
      return;
    }

    this.loading = true;
    
    // Simulación de envío
    Swal.fire({
      title: 'Enviando...',
      text: 'Subiendo tu comprobante',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    // AQUÍ IRÍA LA LLAMADA REAL AL SERVICIO
    // this.ordenService.subirComprobante(...)
    
    console.log("Enviando archivo:", this.archivoComprobante.name);

    this.OrdenService.informarPago(this.orden.id, this.archivoComprobante).subscribe({
      next: () => {
        this.loading = false;
        Swal.fire({
          icon: 'success',
          title: '¡Comprobante Enviado!',
          text: 'El vendedor verificará tu pago pronto.',
          timer: 3000,
          showConfirmButton: false
        }).then(() => {
          this.router.navigate(['/dashboard'], { queryParams: { tab: 'compras' } });
        });
      },
      error: (err) => {
        this.loading = false;
        Swal.fire('Error', 'No se pudo subir el comprobante. Intenta nuevamente.', 'error');
      }
    });
  }

  redirigirWhatsApp() {
    if (!this.orden?.tienda?.whatsapp) {
      Swal.fire('Atención', 'Esta tienda no tiene configurado un número de WhatsApp.', 'info');
      return;
    }

    let telefono = String(this.orden.tienda.whatsapp).replace(/\D/g, '');
    const url = window.location.origin;
    const msg = `Hola, vengo de comprar en la tienda. Esta es mi Orden #${this.orden.id}.\nTotal Pagar: $${this.orden.total}\n¿Me ayudas a validar mi pago?\n\nDetalles: ${url}/dashboard?tab=compras`;
    
    // Check if phone has country code or missing it, usually wa.me requires country code, e.g., 569...
    const fullUrl = `https://wa.me/${telefono}?text=${encodeURIComponent(msg)}`;
    window.open(fullUrl, '_blank');
  }
}