import { Component, inject, OnInit } from '@angular/core';
import { SuperAdminService } from '../../services/super-admin';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-super-admin-tiendas',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './super-admin-tiendas.html',
  styleUrl: './super-admin-tiendas.scss',
})
export class SuperAdminTiendas implements OnInit {
  private superAdminService = inject(SuperAdminService);

  tiendas: any[] = [];
  
  // Modelo para el formulario
  nuevaTienda = {
    nombre: '',
    slug: '',
    emailAdmin: ''
  };

  ngOnInit() {
    this.cargarTiendas();
  }

  cargarTiendas() {
    this.superAdminService.getTiendas().subscribe(data => this.tiendas = data);
  }

  crear() {
    if(!this.nuevaTienda.nombre || !this.nuevaTienda.emailAdmin) return;

    // Autogenerar slug si está vacío (Ej: "Don Pepe" -> "don-pepe")
    if (!this.nuevaTienda.slug) {
      this.nuevaTienda.slug = this.nuevaTienda.nombre.toLowerCase().replace(/ /g, '-');
    }

    this.superAdminService.crearTienda(this.nuevaTienda).subscribe({
      next: (resp) => {
        alert(resp); // Mensaje de éxito del backend
        this.cargarTiendas(); // Recargar tabla
        this.nuevaTienda = { nombre: '', slug: '', emailAdmin: '' }; // Limpiar form
      },
      error: (err) => {
        alert(err.error || 'Error al crear tienda');
        console.error(err);
      }
    });
  }
}