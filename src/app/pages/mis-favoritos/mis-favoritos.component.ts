import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FavoritoService } from '../../services/favorito.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-mis-favoritos',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './mis-favoritos.component.html',
  styleUrls: ['./mis-favoritos.component.scss']
})
export class MisFavoritosComponent implements OnInit {
  favoritoService = inject(FavoritoService);
  productos: any[] = [];
  cargando = true;

  ngOnInit() {
    this.cargarFavoritos();
  }

  cargarFavoritos() {
    this.cargando = true;
    this.favoritoService.getFavoritos().subscribe({
      next: (data) => {
        this.productos = data;
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error', err);
        this.cargando = false;
      }
    });
  }

  quitarFavorito(productoId: number) {
    this.favoritoService.eliminarFavorito(productoId).subscribe({
      next: () => {
        this.productos = this.productos.filter(p => p.id !== productoId);
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Eliminado de favoritos',
          showConfirmButton: false,
          timer: 2000
        });
      }
    });
  }
}
