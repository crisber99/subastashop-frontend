import { Component, inject, OnInit } from '@angular/core';
import { ProductService } from '../../services/product';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  private productService = inject(ProductService);

  pujas: any[] = [];
  ordenes: any[] = [];
  tabActual: string = 'pujas'; // 'pujas' o 'compras'

  stats = {
  usuarios: 0,
  ventas: 0,
  subastasActivas: 0,
  ingresos: 0
};

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    // 1. CARGAR ESTADÍSTICAS (Solo si es Admin)
    // Aquí conectamos con el endpoint que creaste
    this.productService.getAdminStats().subscribe({
      next: (data: any) => {
        console.log('Datos del Dashboard:', data);
        
        // Mapeamos lo que llega del Backend a tu objeto local
        this.stats = {
          usuarios: data.totalUsuarios,       // Backend: totalUsuarios -> Frontend: usuarios
          subastasActivas: data.subastasActivas,
          ventas: data.ventasCerradas,        // Backend: ventasCerradas -> Frontend: ventas
          ingresos: data.gananciasTotales     // Backend: gananciasTotales -> Frontend: ingresos
        };
      },
      error: (err) => console.error('Error cargando stats:', err)
    });

    // 2. CARGAR TABLAS (Pujas y Compras)
    // Esto está bien, pero recuerda que "getMisPujas" trae las del usuario logueado.
    // Si quieres ver TODAS las pujas del sistema (como Admin), necesitarías otro endpoint.
    this.productService.getMisPujas().subscribe(data => this.pujas = data);
    this.productService.getMisCompras().subscribe(data => this.ordenes = data);
  }
}