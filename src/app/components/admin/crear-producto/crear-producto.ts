import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductService } from '../../../services/product';
import { AuthService } from '../../../services/auth-service';
import { CategoriaService } from '../../../services/categoria';
import { Categoria } from '../../../models/categoria';
import { ImageCompressorService } from '../../../services/image-compressor';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-crear-producto',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './crear-producto.html',
  styleUrl: './crear-producto.scss',
})
export class CrearProducto implements OnInit {
  productService = inject(ProductService);
  authService = inject(AuthService);
  categoriaService = inject(CategoriaService);
  router = inject(Router);
  fb = inject(FormBuilder);

  productoForm!: FormGroup;
  categorias: Categoria[] = [];

  archivosSeleccionados: File[] = [];
  limiteImagenes: number = 8;
  mensajeError = '';
  cargando = false;

  ngOnInit() {
    this.productoForm = this.fb.group({
      nombre: ['', [Validators.required]],
      categoriaId: [null, [Validators.required]],
      descripcion: ['', [Validators.required]],
      tipoVenta: ['SUBASTA', [Validators.required]],
      precioBase: [0],
      stock: [1, [Validators.required, Validators.min(1)]],
      fechaFin: [''],
      precioTicket: [0],
      cantidadNumeros: [100],
      cantidadGanadores: [1],
      premios: this.fb.array([])
    });

    // Validaciones dinámicas según tipo
    this.productoForm.get('tipoVenta')?.valueChanges.subscribe(tipo => {
      this.actualizarValidaciones(tipo);
    });

    // Validar de inicio
    this.actualizarValidaciones(this.productoForm.get('tipoVenta')?.value);

    const user = this.authService.currentUser();
    if (user?.role === 'ROLE_SUPER_ADMIN') {
      this.limiteImagenes = 10;
    } else {
      this.limiteImagenes = 8;
    }

    this.cargarCategorias();
  }

  actualizarValidaciones(tipoVenta: string) {
    const precioBase = this.productoForm.get('precioBase');
    const fechaFin = this.productoForm.get('fechaFin');
    const precioTicket = this.productoForm.get('precioTicket');
    const cantidadNumeros = this.productoForm.get('cantidadNumeros');

    precioBase?.clearValidators();
    fechaFin?.clearValidators();
    precioTicket?.clearValidators();
    cantidadNumeros?.clearValidators();

    if (tipoVenta === 'SUBASTA') {
      precioBase?.setValidators([Validators.required, Validators.min(1)]);
      fechaFin?.setValidators([Validators.required]);
    } else if (tipoVenta === 'DIRECTA') {
      precioBase?.setValidators([Validators.required, Validators.min(1)]);
    } else if (tipoVenta === 'RIFA') {
      precioTicket?.setValidators([Validators.required, Validators.min(1)]);
      cantidadNumeros?.setValidators([Validators.required, Validators.min(1)]);
    }

    precioBase?.updateValueAndValidity();
    fechaFin?.updateValueAndValidity();
    precioTicket?.updateValueAndValidity();
    cantidadNumeros?.updateValueAndValidity();
  }

  cargarCategorias() {
    this.categoriaService.getCategorias().subscribe({
      next: (data) => this.categorias = data,
      error: (err) => console.error('Error al cargar categorías', err)
    });
  }

  get premiosValidos() {
    return this.productoForm.get('premios') as FormArray;
  }

  agregarPremio() {
    const premio = this.fb.group({
      nombre: ['', Validators.required],
      probabilidad: [null, [Validators.required, Validators.min(0), Validators.max(100)]],
      stock: [null, [Validators.min(0)]],
      imagenUrl: ['']
    });
    this.premiosValidos.push(premio);
  }

  eliminarPremio(index: number) {
    this.premiosValidos.removeAt(index);
  }

  imageCompressor = inject(ImageCompressorService);

  async onFileSelected(event: any) {
    const files: FileList = event.target.files;
    const MAX_TOTAL_SIZE = 10 * 1024 * 1024;
    
    const filesArr = Array.from(files);

    if (filesArr.length > this.limiteImagenes) {
      Swal.fire({
        icon: 'warning',
        title: 'Demasiadas imágenes',
        text: `Solo se permite un máximo de ${this.limiteImagenes} imágenes.`
      });
      this.resetInput(event);
      return;
    }

    Swal.fire({ title: 'Comprimiendo imágenes...', text: 'Optimizando para web', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    try {
      const compressedFiles: File[] = [];
      let currentTotal = 0;

      for (const file of filesArr) {
          const compressedFile = await this.imageCompressor.compressImage(file);
          compressedFiles.push(compressedFile);
          currentTotal += compressedFile.size;
      }

      if (currentTotal > MAX_TOTAL_SIZE) {
        Swal.fire({
          icon: 'error',
          title: 'Límite total excedido',
          text: `Aún tras la compresión máxima, las imágenes suman ${(currentTotal / (1024 * 1024)).toFixed(2)}MB, superando los 10MB permitidos.`
        });
        this.resetInput(event);
        return;
      }

      this.archivosSeleccionados = compressedFiles;
      Swal.close(); // Cerramos el loading modal

    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Hubo un problema al intentar procesar y comprimir las imágenes.', 'error');
      this.resetInput(event);
    }
  }

  private resetInput(event: any) {
    event.target.value = ''; 
    this.archivosSeleccionados = [];
  }

  onSubmit() {
    if (this.productoForm.invalid) {
      this.productoForm.markAllAsTouched();
      return;
    }

    if (this.archivosSeleccionados.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Faltan Imágenes',
        text: 'Debes seleccionar al menos una imagen.'
      });
      return;
    }

    const value = this.productoForm.value;
    const esSubasta = value.tipoVenta === 'SUBASTA';

    Swal.fire({
      title: '¿Publicar Producto?',
      text: `Estás creando una ${esSubasta ? 'Subasta' : 'Venta'} por $${value.precioBase || value.precioTicket}`,
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
      html: 'Por favor espera.',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    const formData = new FormData();
    const value = this.productoForm.value;

    this.archivosSeleccionados.forEach(archivo => {
      formData.append('archivos', archivo);
    });

    formData.append('nombre', value.nombre);
    formData.append('descripcion', value.descripcion);
    formData.append('tipoVenta', value.tipoVenta);
    formData.append('stock', value.stock.toString());

    if (value.tipoVenta === 'RIFA') {
      formData.append('precioBase', '0');
    } else {
      formData.append('precioBase', value.precioBase.toString());
    }

    if (value.categoriaId) {
      formData.append('categoriaId', value.categoriaId.toString());
    }

    if (value.tipoVenta === 'SUBASTA' && value.fechaFin) {
      formData.append('fechaFin', value.fechaFin);
    }

    if (value.tipoVenta === 'RIFA') {
      formData.append('precioTicket', value.precioTicket.toString());
      formData.append('cantidadNumeros', value.cantidadNumeros.toString());
      formData.append('cantidadGanadores', value.cantidadGanadores.toString());
    }

    if (value.tipoVenta === 'CAJA_MISTERIOSA' && value.premios?.length > 0) {
      formData.append('premiosCaja', JSON.stringify(value.premios));
    }

    this.productService.crearProducto(formData).subscribe({
      next: () => {
        this.cargando = false;
        Swal.fire({
          icon: 'success',
          title: '¡Publicado!',
          text: 'Producto disponible.',
          timer: 2000,
          showConfirmButton: false
        }).then(() => this.router.navigate(['/admin']));
      },
      error: (err) => {
        console.error(err);
        this.cargando = false;
        const msg = err.error?.message || 'Ocurrió un problema.';
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: msg
        });
      }
    });
  }
}