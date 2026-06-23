import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ProductService } from '../../../services/product';
import { AuthService } from '../../../services/auth-service';
import { ImageCompressorService } from '../../../services/image-compressor';
import { ImageBlurModalComponent } from '../../shared/image-blur-modal/image-blur-modal';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-editar-producto',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ImageBlurModalComponent],
  templateUrl: './editar-producto.html',
  styleUrl: './editar-producto.scss',
})
export class EditarProducto implements OnInit {
  private productService = inject(ProductService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private imageCompressor = inject(ImageCompressorService);

  @ViewChild('blurModal') blurModal!: ImageBlurModalComponent;

  producto: any = {
    nombre: '',
    descripcion: '',
    precioBase: 0,
    fechaInicioSubasta: '',
    fechaFinSubasta: '',
    horasVentaAnticipada: 24,
    chatHabilitado: true,
    destacado: false,
    numeroPares: 5,
    tipoJuego: 'MEMORICE'
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
        if (['SUBASTA', 'ADJUDICADO', 'PAGADO', 'VENDIDO'].includes(data.estado)) {
          Swal.fire({
            icon: 'warning',
            title: 'Atención',
            text: 'Este producto está en una fase avanzada o vendido. Edita con precaución.',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 4000
          });
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

  hacerPrincipal(index: number) {
    if (index > 0 && index < this.imagenesPreview.length) {
      // Intercambiar en preview
      const tempPreview = this.imagenesPreview[0];
      this.imagenesPreview[0] = this.imagenesPreview[index];
      this.imagenesPreview[index] = tempPreview;

      // Si también tenemos archivos seleccionados nuevos (por ejemplo, el usuario subió varias fotos)
      // tendríamos que intercambiarlos, pero en editar-producto los archivos se mezclan con las URL en el backend de forma distinta.
      // Para editar, el backend descarta las URLs y sube los `archivosSeleccionados` de nuevo, o las mantiene si `archivosSeleccionados` está vacío.
      // Sin embargo, como el backend en `editarProducto` ignora las URLs antiguas si envías nuevos archivos,
      // esto sólo ordenará las imágenes si el usuario decide no cambiar los archivos, y espera que el backend lo respete.
      // Espera, el backend no recibe `imagenesUrls` reordenadas, solo recibe las nuevas.
      // Para que se reordenen, tendríamos que enviar el array `imagenesPreview`.
      // Enviar un array de `imagenesExistentes` reordenadas podría requerir un cambio en el backend.
      // Por ahora, intercambiaremos los `archivosSeleccionados` si corresponde.
      if (this.archivosSeleccionados.length === this.imagenesPreview.length) {
        const tempArchivo = this.archivosSeleccionados[0];
        this.archivosSeleccionados[0] = this.archivosSeleccionados[index];
        this.archivosSeleccionados[index] = tempArchivo;
      } else {
        // Si son urls antiguas, el backend actual no las reordena. Tendremos que avisar.
        // Lo ideal es enviar el array reordenado.
        this.producto.imagenes = this.imagenesPreview;
      }
    }
  }

  abrirBlurModal(index: number) {
    // Si la imagen es una URL (antigua), necesitamos convertirla a File primero. 
    // Por simplicidad, el difuminado debería hacerse sobre archivos nuevos subidos.
    // Sin embargo, podemos convertir la URL base64 a File si es un base64, 
    // pero si es http URL hay problemas de CORS.
    // Lo más sencillo es verificar si existe en archivosSeleccionados.
    const file = this.archivosSeleccionados[index];
    if (file) {
      this.blurModal.open(file, index);
    } else {
      // Si el archivo no está en archivosSeleccionados, significa que es una imagen ya subida (URL de Azure).
      // Sería complejo difuminar URLs remotas debido al CORS en el Canvas.
      Swal.fire('Aviso', 'Solo puedes difuminar imágenes que acabas de subir en esta sesión. Para difuminar una imagen antigua, vuelve a subirla.', 'info');
    }
  }

  onBlurSave(event: { file: File, index: number }) {
    this.archivosSeleccionados[event.index] = event.file;
    const reader = new FileReader();
    reader.onload = () => {
      this.imagenesPreview[event.index] = reader.result as string;
    };
    reader.readAsDataURL(event.file);
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
                const user = this.authService.currentUser();
                if (user && (user.role === 'SUPER_ADMIN' || user.rol === 'SUPER_ADMIN' || user.role === 'ROLE_SUPER_ADMIN')) {
                  this.router.navigate(['/super-admin']);
                } else {
                  this.router.navigate(['/admin']);
                }
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
