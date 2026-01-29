import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // Para @for, pipes, etc
import { RouterModule } from '@angular/router'; // Para routerLink
import { SuperAdminService } from '../../services/super-admin';
@Component({
  selector: 'app-super-admin-reportes',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './super-admin-reportes.html',
  styleUrl: './super-admin-reportes.scss',
})
export class SuperAdminReportes implements OnInit {

  // 👇 Solución Error 3: Inyectamos el servicio, no el HttpClient directo
  private superAdminService = inject(SuperAdminService);

  reportes: any[] = [];

  ngOnInit() {
    this.cargarReportes();
  }

  // 👇 Solución Error 1: Creamos el método que faltaba
  cargarReportes() {
    this.superAdminService.getReportesPendientes().subscribe({
      next: (data) => {
        this.reportes = data;
        console.log('Reportes cargados:', data);
      },
      error: (err) => console.error('Error al cargar reportes:', err)
    });
  }

  tomarAccion(reporteId: number, accion: string) {
    if (!confirm(`¿Confirmas la acción: ${accion}?`)) return;

    this.superAdminService.gestionarReporte(reporteId, accion).subscribe({
      next: () => {
        alert("Acción realizada correctamente ✅");
        this.cargarReportes(); // Recargamos la tabla para que desaparezca el reporte
      },
      error: (err) => alert("Error al procesar la acción ❌")
    });
  }
}
