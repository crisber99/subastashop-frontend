import { Component, inject, OnInit } from '@angular/core';
import { Shop } from '../../services/shop';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './landing.html',
  styleUrl: './landing.scss',
})
export class Landing implements OnInit {
  private shopService = inject(Shop);

  tiendas: any[] = [];
  tiendasFiltradas: any[] = [];
  busqueda: string = '';

  ngOnInit() {
    this.shopService.getTiendas().subscribe(data => {
      this.tiendas = data;
      this.tiendasFiltradas = data;
    });
  }

  filtrar() {
    this.tiendasFiltradas = this.tiendas.filter(t => 
      t.nombre.toLowerCase().includes(this.busqueda.toLowerCase())
    );
  }
  
  // Generador de color aleatorio para el avatar si no tiene logo
  getColor(nombre: string): string {
    const colores = ['bg-primary', 'bg-success', 'bg-danger', 'bg-warning', 'bg-info', 'bg-dark'];
    const index = nombre.length % colores.length;
    return colores[index];
  }
}