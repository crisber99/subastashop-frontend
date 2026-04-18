import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ProductService } from '../../../services/product';
import { AuthService } from '../../../services/auth-service';
import { ImageCompressorService } from '../../../services/image-compressor';
import Swal from 'sweetalert2'; 

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
  private authService = inject(AuthService);
  private imageCompressor = inject(ImageCompressorService);

  producto: any = {
    nombre: '',
    descripcion: '',
    precioBase: 0,
    fechaInicioSubasta: '',
    fechaFinSubasta: '',
    horasVentaAnticipada: 24,
    chatHabilitado: true,
    destacado: false,
    numeroPares: 5
  };

  archivosSeleccionados: File[] = [];
  imagenesPreview: string[] = [];
  cargando = false;
  idProducto: number = 0;
  isProUsuario: boolean = false;

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.idProducto = +id;
      this.checkProStatus();
      this.cargarProducto(this.idProducto);
    }
  }

  checkProStatus() {
    const user = this.authService.currentUser();
    if (user?.role === 'ROLE_SUPER_ADMIN') {
      this.isProUsuario = true;
    } else {
      this.isProUsuario = !!(user?.suscripcionActiva || user?.pagoAutomatico);
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

        // --- VALIDACIÓN DE AUTORÍA ---
        const user = this.authService.currentUser();
        const isAdmin = user?.role === 'ROLE_SUPER_ADMIN';
        const isOwner = user?.id === data.tiendaUsuarioId;

        if (!isAdmin && !isOwner) {
          Swal.fire({
            icon: 'error',
            title: 'Acceso Denegado',
            text: '⛔ No tienes permisos para editar este producto.',
            confirmButtonText: 'Volver'
          }).then(() => {
            this.router.navigate(['/admin']);
          });
          return;
        }

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
        
        if (!this.isProUsuario) {
          this.producto.chatHabilitado = false;
        }

        if (this.producto.fechaFinSubasta) {
          this.producto.fechaFinSubasta = this.formatearFechaParaInput(this.producto.fechaFinSubasta);
        }
        if (this.producto.fechaInicioSubasta) {
          this.producto.fechaInicioSubasta = this.formatearFechaParaInput(this.producto.fechaInicioSubasta);
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

  async onFilesSelected(event: any) {
    const files = event.target.files;
    const MAX_TOTAL_SIZE = 10 * 1024 * 1024; // 10MB

    if (files && files.length > 0) {
      const filesArr = Array.from(files) as File[];
      
      Swal.fire({ title: 'Optimizando imágenes...', text: 'Procesando para mayor velocidad', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

      try {
        const compressedFiles: File[] = [];
        let totalSize = 0;

        for (const file of filesArr) {
          const compressedFile = await this.imageCompressor.compressImage(file);
          compressedFiles.push(compressedFile);
          totalSize += compressedFile.size;
        }

        if (totalSize > MAX_TOTAL_SIZE) {
          Swal.fire({
            icon: 'error',
            title: 'Límite excedido',
            text: `Aún tras la compresión, el tamaño total supera los 10MB.`
          });
          this.resetSelection(event);
          return;
        }

        this.archivosSeleccionados = compressedFiles;
        this.imagenesPreview = [];
        
        this.archivosSeleccionados.forEach(file => {
          const reader = new FileReader();
          reader.onload = () => {
            this.imagenesPreview.push(reader.result as string);
          };
          reader.readAsDataURL(file);
        });

        Swal.close();
      } catch (err) {
        console.error(err);
        Swal.fire('Error', 'No se pudieron optimizar las imágenes', 'error');
        this.resetSelection(event);
      }
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