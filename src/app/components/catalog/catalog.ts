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
    // 1. PRIMERA LLAMADA: Traemos la info de la tienda (Color, Nombre, Rut)
    this.productService.obtenerTiendaPorSlug(slug).subscribe({
      next: (data: any) => {
        console.log("🏪 Datos Tienda (Identidad):", data);
        
        // Guardamos la identidad visual
        this.tienda = data; 
        this.nombreTienda = data.nombre;

        // 2. SEGUNDA LLAMADA: Traemos los productos (Usando el endpoint específico de productos)
        // Esto soluciona que la lista llegue vacía
        this.productService.getProductosPorTienda(slug).subscribe({
            next: (prods: any[]) => {
                console.log("📦 Productos recibidos:", prods);
                this.productos = prods; // ¡Aquí sí llegarán los productos!
            },
            error: (err) => console.error("Error cargando productos:", err)
        });
      },
      error: (err) => {
        console.error('Error cargando tienda:', err);
        this.nombreTienda = 'Tienda no encontrada';
      }
    });
  }
}