import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Vital para los inputs
import { Router } from '@angular/router';
import { ProductService } from '../../../services/product';

@Component({
  selector: 'app-crear-producto',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './crear-producto.html',
  styleUrl: './crear-producto.scss',
})
export class CrearProducto {
  productService = inject(ProductService);
  router = inject(Router);

  // Modelo del formulario
  producto = {
    nombre: '',
    descripcion: '',
    tipoVenta: 'SUBASTA', // Valor por defecto
    precioBase: 0,
    stock: 1,
    fechaFin: '',
    precioTicket: 0,
    cantidadNumeros: 100,
    cantidadGanadores: 1
  };

  archivoSeleccionado: File | null = null;
  mensajeError = '';
  cargando = false;

  // Detectar cuando el usuario elige una imagen
  onFileSelected(event: any) {
    this.archivoSeleccionado = event.target.files[0];
  }

  onSubmit() {
    if (!this.archivoSeleccionado) {
      this.mensajeError = 'Debes seleccionar una imagen';
      return;
    }

    this.cargando = true;
    const formData = new FormData();

    // Agregamos los campos tal cual los espera el Backend (@RequestParam)
    formData.append('file', this.archivoSeleccionado);
    formData.append('nombre', this.producto.nombre);
    formData.append('descripcion', this.producto.descripcion);
    formData.append('tipoVenta', this.producto.tipoVenta);
    formData.append('precioBase', this.producto.precioBase.toString());
    formData.append('stock', this.producto.stock.toString());

    if (this.producto.tipoVenta === 'SUBASTA' && this.producto.fechaFin) {
      formData.append('fechaFin', this.producto.fechaFin);
    }

    if (this.producto.tipoVenta === 'RIFA') {
      formData.append('precioTicket', this.producto.precioTicket.toString());
      formData.append('cantidadNumeros', this.producto.cantidadNumeros.toString());
      formData.append('cantidadGanadores', this.producto.cantidadGanadores.toString());
    }

    this.productService.crearProducto(formData).subscribe({
      next: (resp) => {
        alert('¡Producto publicado con éxito!');
        this.router.navigate(['/']); // Volver al catálogo
      },
      error: (err) => {
        console.error(err);
        this.mensajeError = 'Error al subir el producto. Revisa la consola.';
        this.cargando = false;
      }
    });
  }
}