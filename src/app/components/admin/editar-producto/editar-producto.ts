import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ProductService } from '../../../services/product';

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
    this.productService.getProductoById(id).subscribe({
      next: (data: any) => {
        // Validar si es editable antes de mostrar el formulario
        if (['SUBASTA', 'ADJUDICADO', 'PAGADO'].includes(data.estado)) {
          alert('⛔ Este producto no se puede editar porque está activo o vendido.');
          this.router.navigate(['/admin']);
          return;
        }

        this.producto = data;
        if (this.producto.fechaFinSubasta) {
          this.producto.fechaFinSubasta = this.formatearFechaParaInput(this.producto.fechaFinSubasta);
        }


        this.imagenPreview = data.urlImagen;
      },
      error: () => this.router.navigate(['/admin'])
    });
  }

  private formatearFechaParaInput(fechaIso: string): string {
    if (!fechaIso) return '';
    // El backend suele enviar: 2026-01-20T15:30:00
    // El input quiere: 2026-01-20T15:30 (sin segundos si no los soporta, o formato exacto)
    return fechaIso.substring(0, 16); // Cortamos los segundos y milisegundos extra
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
    this.cargando = true;
    this.productService.updateProducto(this.idProducto, this.producto, this.archivoSeleccionado || undefined)
      .subscribe({
        next: () => {
          alert('¡Producto actualizado correctamente! ✅');
          this.router.navigate(['/admin']);
        },
        error: (err) => {
          alert('Error al actualizar: ' + (err.error || 'Intente nuevamente'));
          this.cargando = false;
        }
      });
  }
}