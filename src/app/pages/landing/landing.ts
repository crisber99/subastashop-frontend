import { Component, inject, OnInit } from '@angular/core';
import { Shop } from '../../services/shop';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LayoutService } from '../../services/layout';
import { AuthService } from '../../services/auth-service';
import { CategoriaService } from '../../services/categoria';
import { Categoria } from '../../models/categoria';
import { Router } from '@angular/router';
import { ProductService } from '../../services/product';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './landing.html',
  styleUrl: './landing.scss',
})
export class Landing implements OnInit {
  private shopService = inject(Shop);
  public layoutService = inject(LayoutService);
  public authService = inject(AuthService);
  private categoriaService = inject(CategoriaService);
  private router = inject(Router);
  private productService = inject(ProductService);

  tiendas: any[] = [];
  tiendasFiltradas: any[] = [];
  tiendasEnVivo: any[] = [];
  productosDestacados: any[] = [];
  ofertonesGanados: any[] = [];
  categorias: Categoria[] = [];
  busqueda: string = '';
  loading: boolean = true;
  loadingDestacados: boolean = true;

  ngOnInit() {
    this.loading = true;
    this.shopService.getTiendas().subscribe({
      next: (data) => {
        this.tiendas = data;
        this.tiendasFiltradas = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar tiendas:', err);
        this.loading = false;
      }
    });
    this.cargarDestacados();
    this.cargarCategorias();
    this.cargarOfertones();
    this.cargarTiendasEnVivo();
  }

  cargarTiendasEnVivo() {
    this.shopService.getTiendasEnVivo().subscribe({
      next: (data) => this.tiendasEnVivo = data,
      error: (err) => console.error('Error al cargar tiendas en vivo:', err)
    });
  }

  cargarDestacados() {
    this.loadingDestacados = true;
    this.productService.getProductosDestacados().subscribe({
      next: (data) => {
        this.productosDestacados = data;
        this.loadingDestacados = false;
      },
      error: (err) => {
        console.error('Error al cargar destacados:', err);
        this.loadingDestacados = false;
      }
    });
  }

  cargarOfertones() {
    this.productService.getOfertonesGanados().subscribe({
      next: (data) => {
        this.ofertonesGanados = data;
      },
      error: (err) => console.error('Error al cargar ofertones', err)
    });
  }

  cargarCategorias() {
    this.categoriaService.getCategorias().subscribe(data => this.categorias = data);
  }

  seleccionarCategoria(catId: number | null) {
    if (catId === null) {
        this.router.navigate(['/catalogo-global']);
    } else {
        this.router.navigate(['/catalogo-global'], { queryParams: { categoria: catId } });
    }
  }

  filtrar() {
    this.tiendasFiltradas = this.tiendas.filter(t => 
      t.nombre.toLowerCase().includes(this.busqueda.toLowerCase())
    );
  }
}
