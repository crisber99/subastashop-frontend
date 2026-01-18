import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.scss',
})
export class AdminDashboard implements OnInit {
  private http = inject(HttpClient);
  
  stats: any = {
    totalUsuarios: 0,
    subastasActivas: 0,
    ventasCerradas: 0,
    gananciasTotales: 0
  };

  // Configuración del Gráfico de Torta (Pie Chart)
  public pieChartData: ChartConfiguration<'pie'>['data'] = {
    labels: [ 'Subastas Activas', 'Vendidos', 'Cancelados' ],
    datasets: [ {
      data: [ 0, 0, 0 ] // Se llenará con datos reales
    } ]
  };
  public pieChartOptions: ChartOptions<'pie'> = {
    responsive: true,
  };
  public pieChartLegend = true;

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    // Recuerda usar tu URL de API real o environment
    // Aquí asumimos que tienes un servicio, pero lo llamaremos directo por simplicidad del ejemplo
    this.http.get<any>('https://TU-API-AZURE/api/admin/stats').subscribe(data => {
      this.stats = data;
      
      // Actualizar gráfico dinámicamente
      this.pieChartData = {
        labels: ['Subastas Activas', 'Ventas Cerradas'],
        datasets: [{
          data: [data.subastasActivas, data.ventasCerradas],
          backgroundColor: ['#36A2EB', '#4BC0C0']
        }]
      };
    });
  }
}