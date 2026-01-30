import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // 👈 Importante para ngModel
import { TiendaService } from '../../services/tienda';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-admin-config',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './admin-config.html',
  styleUrl: './admin-config.scss',
})
export class AdminConfig implements OnInit {

  private tiendaService = inject(TiendaService);

  // Modelo de datos del formulario
  config = {
    rutEmpresa: '',
    datosBancarios: '',
    colorPrimario: '#0d6efd' // Azul por defecto
  };

  // Variables para las fotos
  fileAnverso: File | null = null;
  fileReverso: File | null = null;

  // Variables de estado (para mostrar spinners o mensajes)
  loading = false;
  mensaje = '';

  aceptaTerminos: boolean = false;

  ngOnInit() {
    this.cargarDatosActuales();
  }

  cargarDatosActuales() {
    this.tiendaService.getMiTienda().subscribe({
      next: (data) => {
        // Rellenamos el formulario con lo que venga de la BD
        this.config.rutEmpresa = data.rutEmpresa || '';
        this.config.datosBancarios = data.datosBancarios || '';
        this.config.colorPrimario = data.colorPrimario || '#0d6efd';

        if (data.fechaAceptacionTerminos) {
          this.aceptaTerminos = true;
        }
      },
      error: (err) => console.error('Error cargando tienda', err)
    });
  }

  // Detectar cuando el usuario selecciona un archivo
  onFileSelected(event: any, tipo: 'anverso' | 'reverso') {
    const file = event.target.files[0];
    if (file) {
      if (tipo === 'anverso') this.fileAnverso = file;
      else this.fileReverso = file;
    }
  }

  guardarCambios() {
    this.loading = true;
    this.mensaje = '';

    // Creamos el FormData (necesario para enviar archivos + texto)
    const formData = new FormData();
    formData.append('rutEmpresa', this.config.rutEmpresa);
    formData.append('datosBancarios', this.config.datosBancarios);
    formData.append('colorPrimario', this.config.colorPrimario);
    formData.append('aceptaTerminos', this.aceptaTerminos.toString());

    if (this.fileAnverso) formData.append('fotoAnverso', this.fileAnverso);
    if (this.fileReverso) formData.append('fotoReverso', this.fileReverso);

    this.tiendaService.actualizarConfiguracion(formData).subscribe({
      next: () => {
        this.loading = false;
        alert('✅ Configuración guardada exitosamente.');
      },
      error: (err) => {
        this.loading = false;
        console.error(err);
        alert('❌ Error al guardar cambios.');
      }
    });
  }
}