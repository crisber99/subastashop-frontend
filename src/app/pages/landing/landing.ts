import { Component, inject, OnInit } from '@angular/core';
import { Shop } from '../../services/shop';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LayoutService } from '../../services/layout';
import { AuthService } from '../../services/auth-service';

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

  tiendas: any[] = [];
  tiendasFiltradas: any[] = [];
  busqueda: string = '';
  loading: boolean = true;

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
  }

  filtrar() {
    this.tiendasFiltradas = this.tiendas.filter(t => 
      t.nombre.toLowerCase().includes(this.busqueda.toLowerCase())
    );
  }
}