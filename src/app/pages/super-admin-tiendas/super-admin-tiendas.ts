import { Component, inject, OnInit } from '@angular/core';
import { SuperAdminService } from '../../services/super-admin';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import Swal from 'sweetalert2';

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
    if(!this.nuevaTienda.nombre || !this.nuevaTienda.emailAdmin) {
        Swal.fire('Campos vacíos', 'Completa el nombre y el correo del administrador.', 'warning');
        return;
    }

    if (!this.nuevaTienda.slug) {
      this.nuevaTienda.slug = this.nuevaTienda.nombre.toLowerCase().replace(/ /g, '-');
    }

    Swal.fire({title: 'Creando...', didOpen: () => Swal.showLoading()});

    this.superAdminService.crearTienda(this.nuevaTienda).subscribe({
      next: (resp) => {
        Swal.fire('¡Creada!', String(resp), 'success');
        this.cargarTiendas(); 
        this.nuevaTienda = { nombre: '', slug: '', emailAdmin: '' }; 
      },
      error: (err) => {
        Swal.fire('Error', err.error || 'Error al crear tienda', 'error');
        console.error(err);
      }
    });
  }
}