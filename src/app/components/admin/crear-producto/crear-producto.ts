import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductService } from '../../../services/product';
import { AuthService } from '../../../services/auth-service'; // 👈 Asegúrate de que esta ruta sea correcta
import Swal from 'sweetalert2';

@Component({
  selector: 'app-crear-producto',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './crear-producto.html',
  styleUrl: './crear-producto.scss',
})
export class CrearProducto implements OnInit {
  productService = inject(ProductService);
  authService = inject(AuthService); // 👈 Inyectamos Auth para verificar el rol
  router = inject(Router);

  producto = {
    nombre: '',
    descripcion: '',
    tipoVenta: 'SUBASTA',
    precioBase: 0,
    stock: 1,
    fechaFin: '',
    precioTicket: 0,
    cantidadNumeros: 100,
    cantidadGanadores: 1
  };

  // 👇 Ahora es un arreglo para soportar múltiples fotos
  archivosSeleccionados: File[] = [];
  limiteImagenes: number = 8;
  mensajeError = '';
  cargando = false;

  ngOnInit() {
    // Calculamos el límite según el rol
    const user = this.authService.currentUser();
    if (user?.role === 'ROLE_SUPER_ADMIN') {
      this.limiteImagenes = 10;
    } else {
      this.limiteImagenes = 8;
    }
  }

  onFileSelected(event: any) {
    const files: FileList = event.target.files;
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB individual
    const MAX_TOTAL_SIZE = 10 * 1024 * 1024; // 10MB total (según server.multipart.max-request-size)
    
    let currentTotal = 0;
    const filesArr = Array.from(files);

    // 1. Validación de tamaño
    for (const file of filesArr) {
        if (file.size > MAX_SIZE) {
            Swal.fire({
                icon: 'error',
                title: 'Archivo muy pesado',
                text: `El archivo "${file.name}" supera el límite de 10MB.`
            });
            this.resetInput(event);
            return;
        }
        currentTotal += file.size;
    }

    if (currentTotal > MAX_TOTAL_SIZE) {
      Swal.fire({
        icon: 'error',
        title: 'Límite total excedido',
        text: `El conjunto de archivos suma ${(currentTotal / (1024 * 1024)).toFixed(2)}MB, superando el límite total de 10MB permitido por el servidor.`
      });
      this.resetInput(event);
      return;
    }
    
    // 2. Validación de cantidad de fotos
    if (files.length > this.limiteImagenes) {
      Swal.fire({
        icon: 'warning',
        title: 'Demasiadas imágenes',
        text: `Tu plan solo permite subir un máximo de ${this.limiteImagenes} imágenes.`
      });
      this.resetInput(event);
      return;
    }

    this.archivosSeleccionados = filesArr;
  }

  private resetInput(event: any) {
    event.target.value = ''; 
    this.archivosSeleccionados = [];
  }

  onSubmit() {
    if (this.archivosSeleccionados.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Faltan Imágenes',
        text: 'Debes seleccionar al menos una imagen para el producto.'
      });
      return;
    }

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
    
    Swal.fire({
      title: 'Subiendo Producto...',
      html: 'Por favor espera un momento.',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    const formData = new FormData();

    // 👇 MAGIA: Adjuntamos todas las imágenes seleccionadas
    this.archivosSeleccionados.forEach(archivo => {
      formData.append('archivos', archivo); // Debe coincidir con @RequestParam("archivos")
    });

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
          this.router.navigate(['/admin']);
        });
      },
      error: (err) => {
        console.error(err);
        this.cargando = false;
        
        const errorMsg = err.error?.message || 'Ocurrió un problema al subir el producto. Revisa los datos e intenta nuevamente.';
        
        Swal.fire({
          icon: 'error',
          title: 'Error al Publicar',
          text: errorMsg,
          confirmButtonText: errorMsg.includes('Configuración de Tienda') ? 'Ir a Configuración' : 'Entendido'
        }).then((res) => {
          if (res.isConfirmed && errorMsg.includes('Configuración de Tienda')) {
            this.router.navigate(['/admin/configuracion']);
          }
        });
      }
    });
  }
}