import { Component, inject, OnInit } from '@angular/core';
import { ProductService } from '../../services/product';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth-service';
import { LayoutService } from '../../services/layout';
import { ThemeService } from '../../services/theme-service';
import { CategoriaService } from '../../services/categoria';
import { FavoritoService } from '../../services/favorito.service';
import { Categoria } from '../../models/categoria';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

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
  public themeService = inject(ThemeService);
  private categoriaService = inject(CategoriaService);
  public favoritoService = inject(FavoritoService);

  tienda: any = null; 
  productos: any[] = [];
  productosFiltrados: any[] = [];
  categorias: Categoria[] = [];
  categoriaSeleccionada: number | null = null;
  busqueda: string = '';
  nombreTienda: string = '';
  isLoading: boolean = true; // Empieza cargando

  ngOnInit() {
    if (this.authService.isLoggedIn()) {
      this.favoritoService.cargarIdsFavoritos();
    }

    this.route.paramMap.subscribe(params => {
      this.isLoading = true; // Reiniciar carga al cambiar ruta
      const slug = params.get('slug');
      if (slug) {
        this.cargarPorTienda(slug);
      } else {
        this.nombreTienda = 'Catálogo Global';
        this.tienda = null; 
        this.cargarTodos();
      }
    });

    // Escuchar parámetros de consulta para filtrado inicial (ej desde el landing)
    this.route.queryParamMap.subscribe(params => {
        const catId = params.get('categoria');
        if (catId) {
            this.categoriaSeleccionada = parseInt(catId);
            this.filtrar();
        }
    });

    this.cargarCategorias();
  }

  toggleFavorito(productoId: number, event: Event) {
    event.stopPropagation();
    event.preventDefault();
    if (!this.authService.isLoggedIn()) {
      Swal.fire('Inicia Sesión', 'Debes iniciar sesión para agregar a favoritos', 'info');
      return;
    }
    this.favoritoService.toggleFavorito(productoId).subscribe();
  }

  cargarCategorias() {
    this.categoriaService.getCategorias().subscribe({
      next: (data) => this.categorias = data,
      error: (err) => console.error('Error al cargar categorías', err)
    });
  }

  cargarTodos() {
    this.productService.getProductos().subscribe((data: any) => {
      const prods = data.content ? data.content : data;
      this.productos = prods;
      this.productosFiltrados = prods;
      this.filtrar(); // Aplicar filtro por si venía en queryParams
      this.isLoading = false; // Fin de carga
    });
  }

  cargarPorTienda(slug: string) {
    this.productService.obtenerTiendaPorSlug(slug).subscribe({
      next: (data: any) => {
        this.tienda = data; 
        this.nombreTienda = data.nombre;

        this.productService.getProductosPorTienda(slug).subscribe({
            next: (response: any) => {
                const prods = response.content ? response.content : response;
                this.productos = prods;
                this.productosFiltrados = prods;
                this.filtrar(); // Aplicar filtro por si venía en queryParams
                this.isLoading = false; // Fin de carga
            },
            error: (err) => {
                console.error("Error cargando productos:", err);
                this.isLoading = false;
            }
        });
      },
      error: (err) => {
        console.error('Error cargando tienda:', err);
        this.nombreTienda = 'Tienda no encontrada';
        this.isLoading = false;
      }
    });
  }

  filtrar() {
    this.productosFiltrados = this.productos.filter(p => {
      const coincideNombre = p.nombre.toLowerCase().includes(this.busqueda.toLowerCase());
      const coincideCategoria = this.categoriaSeleccionada === null || p.categoriaId === this.categoriaSeleccionada;
      return coincideNombre && coincideCategoria;
    });
  }

  seleccionarCategoria(id: number | null) {
    this.categoriaSeleccionada = id;
    this.filtrar();
  }

  canEdit(producto: any): boolean {
    if (this.authService.isSuperAdmin()) return true;
    
    const user = this.authService.currentUser();
    if (!user) return false;

    const userTiendaId = user.tiendaId || user.tienda?.id;
    const prodTiendaId = producto.tiendaId || producto.tienda?.id;

    return userTiendaId && prodTiendaId && userTiendaId === prodTiendaId;
  }
}
