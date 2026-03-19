import { Component, inject, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SuperAdminService } from '../../services/super-admin';
import { ProductService } from '../../services/product';
import Swal from 'sweetalert2';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-super-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './super-admin-dashboard.html',
  styleUrl: './super-admin-dashboard.scss'
})
export class SuperAdminDashboard implements OnInit {
  private superAdminService = inject(SuperAdminService);
  private productService = inject(ProductService);

  stats: any = null;
  tiendas: any[] = [];
  productos: any[] = [];
  reportes: any[] = [];
  loading = true;
  activeTab = 'resumen';

  @ViewChild('statsChart') statsChartCanvas!: ElementRef;
  chart: any;

  nuevaTienda = { nombre: '', slug: '', emailAdmin: '' };

  ngOnInit() {
    this.cargarTodo();
  }

  cargarTodo() {
    this.loading = true;
    this.superAdminService.getStats().subscribe({
      next: (data) => {
        this.stats = data;
        this.loading = false;
        setTimeout(() => this.initChart(), 0);
      },
      error: () => this.loading = false
    });

    this.superAdminService.getTiendas().subscribe(data => this.tiendas = data);
    this.productService.getProductos().subscribe(data => this.productos = data);
    this.superAdminService.getReportesPendientes().subscribe(data => this.reportes = data);
  }

  initChart() {
    if (this.chart) this.chart.destroy();
    
    const ctx = this.statsChartCanvas.nativeElement.getContext('2d');
    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Usuarios', 'Tiendas', 'Productos', 'Subastas'],
        datasets: [{
          label: 'Métricas Globales',
          data: [
            this.stats.totalUsuarios,
            this.stats.totalTiendas,
            this.stats.totalProductos,
            this.stats.subastasActivas
          ],
          backgroundColor: [
            'rgba(54, 162, 235, 0.6)',
            'rgba(75, 192, 192, 0.6)',
            'rgba(255, 206, 86, 0.6)',
            'rgba(255, 99, 132, 0.6)'
          ],
          borderColor: [
            'rgba(54, 162, 235, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(255, 99, 132, 1)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false }
        }
      }
    });
  }

  crearTienda() {
    if(!this.nuevaTienda.nombre || !this.nuevaTienda.emailAdmin) {
        Swal.fire('Atención', 'Nombre y Email son obligatorios.', 'warning');
        return;
    }
    Swal.fire({title: 'Procesando...', didOpen: () => Swal.showLoading()});
    this.superAdminService.crearTienda(this.nuevaTienda).subscribe({
      next: () => {
        Swal.fire('¡Tienda Creada!', '', 'success');
        this.cargarTodo();
        this.nuevaTienda = { nombre: '', slug: '', emailAdmin: '' };
      },
      error: (err) => Swal.fire('Error', err.error || 'Error al crear', 'error')
    });
  }

  tomarAccionReporte(reporteId: number, accion: string) {
    Swal.fire({
        title: `¿Confirmar ${accion}?`,
        text: 'Se aplicará la acción al reporte seleccionado.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Confirmar'
    }).then((result) => {
        if(result.isConfirmed) {
            this.superAdminService.gestionarReporte(reporteId, accion).subscribe({
              next: () => {
                Swal.fire('¡Éxito!', 'Acción procesada.', 'success');
                this.cargarTodo(); 
              },
              error: () => Swal.fire('Error', 'No se pudo procesar.', 'error')
            });
        }
    });
  }
}
