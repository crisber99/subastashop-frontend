import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrdenService } from '../../services/orden';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-admin-validar-pagos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-validar-pagos.html',
  styleUrl: './admin-validar-pagos.scss'
})
export class AdminValidarPagos implements OnInit {
  private ordenService = inject(OrdenService);
  ordenes: any[] = [];
  loading = false;

  ngOnInit() {
    this.cargarPendientes();
  }

  cargarPendientes() {
    this.loading = true;
    this.ordenService.getPendientesValidacion().subscribe({
      next: (data) => {
        this.ordenes = data;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  verComprobante(url: string) {
    if (!url) {
        Swal.fire('Error', 'No hay comprobante disponible para esta orden.', 'error');
        return;
    }

    const esPdf = url.toLowerCase().includes('.pdf') || url.toLowerCase().includes('application/pdf');

    if (esPdf) {
      // Para PDFs abrimos en nueva pestaña para que el browser lo renderice nativamente
      Swal.fire({
        title: 'Comprobante PDF',
        icon: 'info',
        html: `
          <p class="text-muted">El comprobante es un archivo PDF.</p>
          <a href="${url}" target="_blank" class="btn btn-primary px-4 mt-2">
            <i class="bi bi-file-earmark-pdf me-2"></i> Abrir PDF en nueva pestaña
          </a>
        `,
        showCloseButton: true,
        showConfirmButton: false,
        width: '500px'
      });
    } else {
      Swal.fire({
        title: 'Comprobante de Pago',
        imageUrl: url,
        imageAlt: 'Captura de transferencia',
        imageWidth: '100%',
        width: '700px',
        showCloseButton: true,
        confirmButtonText: 'Cerrar',
        confirmButtonColor: '#3085d6'
      });
    }
  }

  aprobar(id: number) {
    Swal.fire({
      title: '¿Aprobar pago?',
      text: "Se marcarán los productos como VENDIDOS y se notificará al cliente.",
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, aprobar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#28a745'
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({ title: 'Procesando...', didOpen: () => Swal.showLoading() });
        this.ordenService.aprobarPago(id).subscribe({
          next: () => {
            Swal.fire('¡Éxito!', 'Pago aprobado correctamente.', 'success');
            this.cargarPendientes();
          },
          error: () => Swal.fire('Error', 'No se pudo realizar la acción.', 'error')
        });
      }
    });
  }

  rechazar(id: number) {
    Swal.fire({
      title: '¿Rechazar pago?',
      text: "Indica el motivo del rechazo para informar al cliente por correo electrónico:",
      icon: 'warning',
      input: 'textarea',
      inputPlaceholder: 'Ej: El comprobante no es legible o el monto es incorrecto...',
      showCancelButton: true,
      confirmButtonText: 'Sí, rechazar y notificar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33'
    }).then((result) => {
      if (result.isConfirmed) {
        const motivo = result.value || '';
        Swal.fire({ title: 'Procesando...', didOpen: () => Swal.showLoading(), allowOutsideClick: false });
        this.ordenService.rechazarPago(id, motivo).subscribe({
          next: () => {
            Swal.fire('¡Orden Cancelada!', 'El pago ha sido rechazado y se ha notificado al cliente por email.', 'info');
            this.cargarPendientes();
          },
          error: () => Swal.fire('Error', 'No se pudo realizar la acción.', 'error')
        });
      }
    });
  }
}
