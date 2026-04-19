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
        Swal.fire('Error', 'No hay comprobante disponible', 'error');
        return;
    }
    Swal.fire({
      title: 'Comprobante de Pago',
      imageUrl: url,
      imageAlt: 'Captura de transferencia',
      width: '600px',
      showCloseButton: true,
      confirmButtonText: 'Cerrar',
      confirmButtonColor: '#3085d6'
    });
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
