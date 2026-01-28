import { Component, inject, OnInit } from '@angular/core';
import { ProductService } from '../../services/product';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth-service';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, RouterModule], // Importante para pipes como currency si los usas
  templateUrl: './catalog.html',
  styleUrl: './catalog.scss'
})
export class CatalogComponent implements OnInit {
  private productService = inject(ProductService);
  private route = inject(ActivatedRoute);

  public authService = inject(AuthService);

  productos: any[] = [];
  nombreTienda: string = '';

  ngOnInit() {
    // Nos suscribimos a los parámetros de la URL
    this.route.paramMap.subscribe(params => {
      const slug = params.get('slug'); // ¿Viene algo como 'don-bernardo'?

      if (slug) {
        // MODO TIENDA: Cargar productos específicos
        this.nombreTienda = slug.replace(/-/g, ' ').toUpperCase(); // Estético: 'don-bernardo' -> 'DON BERNARDO'
        this.cargarPorTienda(slug);
      } else {
        // MODO GLOBAL: Cargar todo (como lo tenías antes)
        this.nombreTienda = 'Catálogo Global';
        this.cargarTodos();
      }
    });
  }

  cargarTodos() {
    this.productService.getProductos().subscribe(data => {
      this.productos = data;
    });
  }

  cargarPorTienda(slug: string) {
    // Usamos el método que ya tienes en tu ProductService
    this.productService.getProductosPorTienda(slug).subscribe({
      next: (data) => {
        this.productos = data;
      },
      error: (err) => console.error('Error cargando tienda:', err)
    });
  }
}