import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { RouterModule } from '@angular/router'; 
import { SuperAdminService } from '../../services/super-admin';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-super-admin-reportes',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './super-admin-reportes.html',
  styleUrl: './super-admin-reportes.scss',
})
export class SuperAdminReportes implements OnInit {

  private superAdminService = inject(SuperAdminService);

  reportes: any[] = [];

  ngOnInit() {
    this.cargarReportes();
  }

  cargarReportes() {
    this.superAdminService.getReportesPendientes().subscribe({
      next: (data) => {
        this.reportes = data;
      },
      error: (err) => console.error('Error al cargar reportes:', err)
    });
  }

  tomarAccion(reporteId: number, accion: string) {
    Swal.fire({
        title: `¿Acción: ${accion}?`,
        text: 'Esta acción podría afectar al usuario o producto reportado.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, Ejecutar',
        confirmButtonColor: accion === 'BLOQUEAR' ? '#d33' : '#3085d6'
    }).then((result) => {
        if(result.isConfirmed) {
            this.superAdminService.gestionarReporte(reporteId, accion).subscribe({
              next: () => {
                Swal.fire('¡Listo!', 'La acción se realizó correctamente.', 'success');
                this.cargarReportes(); 
              },
              error: (err) => Swal.fire('Error', 'No se pudo procesar la acción.', 'error')
            });
        }
    });
  }
}