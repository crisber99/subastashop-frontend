import { Component, inject, OnInit } from '@angular/core';
import { ProductService } from '../../services/product';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, RouterModule], // Importante para pipes como currency si los usas
  templateUrl: './catalog.html',
  styleUrl: './catalog.scss'
})
export class CatalogComponent implements OnInit {
  private productService = inject(ProductService);
  productos: any[] = [];

  ngOnInit(): void {
    this.productService.getProductos().subscribe({
      next: (data) => {
        this.productos = data;
        console.log('Productos cargados:', data);
      },
      error: (err) => console.error('Error cargando productos:', err)
    });
  }
}