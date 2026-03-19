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

  archivosSeleccionados: File[] = [];
  imagenesPreview: string[] = [];
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

        this.imagenesPreview = data.imagenes || [];
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

  onFilesSelected(event: any) {
    const files = event.target.files;
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB

    if (files && files.length > 0) {
      const filesArr = Array.from(files) as File[];
      let totalSize = 0;

      for (const file of filesArr) {
        if (file.size > MAX_SIZE) {
          Swal.fire({
            icon: 'error',
            title: 'Archivo muy pesado',
            text: `El archivo "${file.name}" supera el límite de 10MB.`
          });
          this.resetSelection(event);
          return;
        }
        totalSize += file.size;
      }

      if (totalSize > MAX_SIZE) {
        Swal.fire({
          icon: 'error',
          title: 'Total excedido',
          text: `La suma de las imágenes (${(totalSize / (1024 * 1024)).toFixed(2)}MB) supera el límite de 10MB.`
        });
        this.resetSelection(event);
        return;
      }

      this.archivosSeleccionados = filesArr;
      this.imagenesPreview = [];
      
      this.archivosSeleccionados.forEach(file => {
        const reader = new FileReader();
        reader.onload = () => {
          this.imagenesPreview.push(reader.result as string);
        };
        reader.readAsDataURL(file);
      });
    }
  }

  private resetSelection(event: any) {
    event.target.value = '';
    this.archivosSeleccionados = [];
    // Nota: Mantener imagenesPreview para que no desaparezcan las viejas si hay error en la selección nueva
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

        this.productService.updateProducto(this.idProducto, this.producto, this.archivosSeleccionados)
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
              const errorMsg = err.error?.message || 'Ocurrió un problema inesperado.';
              Swal.fire({
                icon: 'error',
                title: 'Error al actualizar',
                text: errorMsg
              });
            }
          });
      }
    });
  }
}