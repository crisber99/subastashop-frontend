import { Component, inject, OnInit } from '@angular/core';
import { ProductService } from '../../services/product';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth-service';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './catalog.html',
  styleUrl: './catalog.scss'
})
export class CatalogComponent implements OnInit {
  private productService = inject(ProductService);
  private route = inject(ActivatedRoute);

  public authService = inject(AuthService);

  // ==========================================
  // 👇 1. AQUÍ DEFINIMOS LA VARIABLE FALTANTE
  // ==========================================
  tienda: any = null; // Necesario para que el HTML lea 'tienda.colorPrimario'
  
  productos: any[] = [];
  nombreTienda: string = '';

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const slug = params.get('slug');

      if (slug) {
        // MODO TIENDA
        this.cargarPorTienda(slug);
      } else {
        // MODO GLOBAL
        this.nombreTienda = 'Catálogo Global';
        this.tienda = null; // Reseteamos tienda
        this.cargarTodos();
      }
    });
  }

  cargarTodos() {
    this.productService.getProductos().subscribe(data => {
      this.productos = data;
      this.tienda = null; // No hay tienda específica
    });
  }

  cargarPorTienda(slug: string) {
    // 👇 2. USAMOS EL MÉTODO QUE TRAE DATOS DE TIENDA + PRODUCTOS
    // (Asegúrate de que este método exista en tu ProductService, 
    // si se llama 'getProductosPorTienda' pero devuelve el objeto completo, úsalo).
    this.productService.obtenerTiendaPorSlug(slug).subscribe({
      next: (data: any) => {
        console.log("Datos tienda recibidos:", data);

        // 👇 3. GUARDAMOS EL OBJETO COMPLETO
        this.tienda = data; 
        
        // Asignamos el resto de variables
        this.productos = data.productos || []; 
        this.nombreTienda = data.nombre; // Usamos el nombre real de la BD
      },
      error: (err) => {
        console.error('Error cargando tienda:', err);
        this.nombreTienda = 'Tienda no encontrada';
      }
    });
  }
}