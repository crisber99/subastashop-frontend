import { Component, inject, OnInit } from '@angular/core';
import { ProductService } from '../../services/product';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth-service';
import { LayoutService } from '../../services/layout';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './catalog.html',
  styleUrl: './catalog.scss'
})
export class CatalogComponent implements OnInit {
  private productService = inject(ProductService);
  private route = inject(ActivatedRoute);
  public authService = inject(AuthService);
  public layoutService = inject(LayoutService);

  tienda: any = null; 
  productos: any[] = [];
  nombreTienda: string = '';

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const slug = params.get('slug');
      if (slug) {
        this.cargarPorTienda(slug);
      } else {
        this.nombreTienda = 'Catálogo Global';
        this.tienda = null; 
        this.cargarTodos();
      }
    });
  }

  cargarTodos() {
    this.productService.getProductos().subscribe(data => {
      this.productos = data;
      this.tienda = null; 
    });
  }

  cargarPorTienda(slug: string) {
    this.productService.obtenerTiendaPorSlug(slug).subscribe({
      next: (data: any) => {
        this.tienda = data; 
        this.nombreTienda = data.nombre;

        this.productService.getProductosPorTienda(slug).subscribe({
            next: (prods: any[]) => {
                this.productos = prods; 
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

  canEdit(producto: any): boolean {
    if (this.authService.isSuperAdmin()) return true;
    
    const user = this.authService.currentUser();
    if (!user) return false;

    // Comparar tenantId o tiendaId
    const userTiendaId = user.tiendaId || user.tienda?.id;
    const prodTiendaId = producto.tiendaId || producto.tienda?.id;

    return userTiendaId && prodTiendaId && userTiendaId === prodTiendaId;
  }
}