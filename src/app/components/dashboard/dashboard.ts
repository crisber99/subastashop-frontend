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

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    // Cargar Pujas
    this.productService.getMisPujas().subscribe(data => this.pujas = data);
    
    // Cargar Compras (Ganadas)
    this.productService.getMisCompras().subscribe(data => this.ordenes = data);
  }
}