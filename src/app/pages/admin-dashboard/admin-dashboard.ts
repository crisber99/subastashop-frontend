import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { RouterModule } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth-service';
import { ThemeService } from '../../services/theme-service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, BaseChartDirective, RouterModule],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.scss',
})
export class AdminDashboard implements OnInit {
  private http = inject(HttpClient);
  public authService = inject(AuthService); // Hacerlo public para el HTML
  public themeService = inject(ThemeService); 
  
  stats: any = {
    totalUsuarios: 0,
    subastasActivas: 0,
    ventasCerradas: 0,
    gananciasTotales: 0
  };

  productos: any[] = [];
  mostrarProductos = false;

  public pieChartData: ChartConfiguration<'pie'>['data'] = {
    labels: [ 'Subastas Activas', 'Ventas Cerradas' ],
    datasets: [ {
      data: [ 0, 0 ] 
    } ]
  };
  public pieChartOptions: ChartOptions<'pie'> = {
    responsive: true,
  };
  public pieChartLegend = true;

  ngOnInit() {
    this.cargarDatos();
    this.cargarProductos();
  }

  cargarDatos() {
    this.http.get<any>(`${environment.apiUrl}/admin/stats`).subscribe(data => {
      this.stats = data;
      
      this.pieChartData = {
        labels: ['Subastas Activas', 'Ventas Cerradas'],
        datasets: [{
          data: [data.subastasActivas, data.ventasCerradas],
          backgroundColor: ['#36A2EB', '#4BC0C0']
        }]
      };
    });
  }

  cargarProductos() {
    this.http.get<any[]>(`${environment.apiUrl}/admin/productos`).subscribe(data => {
      this.productos = data;
    });
  }

  detenerSubastas() {
    Swal.fire({
      title: '¿Detener todas las subastas?',
      text: 'Esto cerrará las subastas activas de tu tienda.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, detener',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.http.post(`${environment.apiUrl}/admin/detener-subastas`, {}).subscribe({
          next: (res: any) => {
            Swal.fire('¡Éxito!', res.message || 'Las subastas han sido detenidas.', 'success');
            this.cargarDatos();
            this.cargarProductos(); // Refrescar lista para ver los estados 'FINALIZADA'
          },
          error: (err) => Swal.fire('Error', 'No se pudieron detener las subastas.', 'error')
        });
      }
    });
  }

  notificarGanadores() {
    Swal.fire({
      title: '¿Enviar notificaciones?',
      text: 'Se enviará un correo a los ganadores de subastas y rifas finalizadas.',
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'Sí, enviar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.http.post(`${environment.apiUrl}/admin/notificar-ganadores`, {}).subscribe({
          next: () => Swal.fire('Enviado', 'Notificaciones enviadas correctamente.', 'success'),
          error: (err) => Swal.fire('Error', 'No se pudieron enviar las notificaciones.', 'error')
        });
      }
    });
  }

  exportarVentas() {
    Swal.fire({ title: 'Generando archivo...', didOpen: () => Swal.showLoading() });
    
    this.http.get(`${environment.apiUrl}/admin/exportar-ventas`, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        const user = this.authService.currentUser();
        const nombreTienda = user?.tienda?.nombre || 'Global';
        const safeNombre = nombreTienda.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
        const now = new Date();
        const timestamp = now.getFullYear() + 
                         ('0' + (now.getMonth() + 1)).slice(-2) + 
                         ('0' + now.getDate()).slice(-2) + '_' + 
                         ('0' + now.getHours()).slice(-2) + 
                         ('0' + now.getMinutes()).slice(-2) + 
                         ('0' + now.getSeconds()).slice(-2);
        
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tienda_${safeNombre}_${timestamp}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        Swal.close();
      },
      error: (err) => Swal.fire('Error', 'No se pudo exportar el archivo.', 'error')
    });
  }

  eliminarProducto(p: any) {
    Swal.fire({
      title: '¿Eliminar producto?',
      text: `¿Estás seguro de que deseas eliminar "${p.nombre}"? Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33'
    }).then((result) => {
      if (result.isConfirmed) {
        this.http.delete(`${environment.apiUrl}/admin/productos/${p.id}`).subscribe({
          next: (res: any) => {
            Swal.fire('¡Eliminado!', res.message || 'El producto ha sido eliminado.', 'success');
            this.cargarProductos(); // <--- CRÍTICO: Refrescar la lista inmediatamente
          },
          error: (err) => Swal.fire('Error', 'No se pudo eliminar el producto.', 'error')
        });
      }
    });
  }
}