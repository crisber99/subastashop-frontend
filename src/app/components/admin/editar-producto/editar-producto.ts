import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ProductService } from '../../../services/product';
import Swal from 'sweetalert2'; // 👈 Importamos SweetAlert

@Component({
  selector: 'app-editar-producto',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './editar-producto.html',
  styleUrl: './editar-producto.scss',
})
export class EditarProducto implements OnInit {
  private productService = inject(ProductService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  producto: any = {
    nombre: '',
    descripcion: '',
    precioBase: 0,
    fechaFin: ''
  };

  archivoSeleccionado: File | null = null;
  imagenPreview: string | null = null;
  cargando = false;
  idProducto: number = 0;

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.idProducto = +id;
      this.cargarProducto(this.idProducto);
    }
  }

  cargarProducto(id: number) {
    // Loader inicial
    Swal.fire({
      title: 'Cargando datos...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    this.productService.getProductoById(id).subscribe({
      next: (data: any) => {
        Swal.close(); // Cerramos el loader

        // Validar si es editable antes de mostrar el formulario
        if (['SUBASTA', 'ADJUDICADO', 'PAGADO'].includes(data.estado)) {
          Swal.fire({
            icon: 'error',
            title: 'Acción Bloqueada',
            text: '⛔ Este producto no se puede editar porque la subasta ya inició o finalizó.',
            confirmButtonText: 'Volver'
          }).then(() => {
            this.router.navigate(['/admin']);
          });
          return;
        }

        this.producto = data;
        if (this.producto.fechaFinSubasta) {
          this.producto.fechaFinSubasta = this.formatearFechaParaInput(this.producto.fechaFinSubasta);
        }

        this.imagenPreview = data.urlImagen;
      },
      error: () => {
        Swal.fire('Error', 'No se pudo cargar el producto', 'error');
        this.router.navigate(['/admin']);
      }
    });
  }

  private formatearFechaParaInput(fechaIso: string): string {
    if (!fechaIso) return '';
    return fechaIso.substring(0, 16); 
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.archivoSeleccionado = file;
      // Crear preview local
      const reader = new FileReader();
      reader.onload = () => this.imagenPreview = reader.result as string;
      reader.readAsDataURL(file);
    }
  }

  guardarCambios() {
    Swal.fire({
      title: '¿Guardar Cambios?',
      text: 'Se actualizará la información del producto.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, Guardar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      
      if (result.isConfirmed) {
        this.cargando = true;
        
        Swal.fire({
          title: 'Actualizando...',
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading()
        });

        this.productService.updateProducto(this.idProducto, this.producto, this.archivoSeleccionado || undefined)
          .subscribe({
            next: () => {
              this.cargando = false;
              Swal.fire({
                icon: 'success',
                title: '¡Actualizado!',
                text: 'El producto se ha modificado correctamente.',
                timer: 2000,
                showConfirmButton: false
              }).then(() => {
                this.router.navigate(['/admin']);
              });
            },
            error: (err) => {
              this.cargando = false;
              Swal.fire({
                icon: 'error',
                title: 'Error al actualizar',
                text: err.error || 'Ocurrió un problema inesperado.'
              });
            }
          });
      }
    });
  }
}