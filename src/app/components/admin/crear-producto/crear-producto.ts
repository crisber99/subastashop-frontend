import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Vital para los inputs
import { Router } from '@angular/router';
import { ProductService } from '../../../services/product';
import Swal from 'sweetalert2'; // 👈 Importamos SweetAlert

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
      Swal.fire({
        icon: 'warning',
        title: 'Falta Imagen',
        text: 'Debes seleccionar una imagen para el producto.'
      });
      return;
    }

    // Confirmación antes de enviar
    Swal.fire({
      title: '¿Publicar Producto?',
      text: `Estás creando una ${this.producto.tipoVenta === 'SUBASTA' ? 'Subasta' : 'Venta Directa/Rifa'} por $${this.producto.precioBase}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, Publicar',
      confirmButtonColor: '#3085d6',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.procesarEnvio();
      }
    });
  }

  procesarEnvio() {
    this.cargando = true;
    
    // Mostrar loader mientras sube
    Swal.fire({
      title: 'Subiendo Producto...',
      html: 'Por favor espera un momento.',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    const formData = new FormData();

    // Agregamos los campos tal cual los espera el Backend (@RequestParam)
    if (this.archivoSeleccionado) {
      formData.append('file', this.archivoSeleccionado);
    }
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
        this.cargando = false;
        
        Swal.fire({
          icon: 'success',
          title: '¡Publicado!',
          text: 'Tu producto ya está disponible en la tienda.',
          timer: 2000,
          showConfirmButton: false
        }).then(() => {
          this.router.navigate(['/admin']); // Volver al panel de admin
        });
      },
      error: (err) => {
        console.error(err);
        this.cargando = false;
        Swal.fire({
          icon: 'error',
          title: 'Error al Publicar',
          text: 'Ocurrió un problema al subir el producto. Revisa los datos e intenta nuevamente.'
        });
      }
    });
  }
}