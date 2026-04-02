import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { TiendaService } from '../../services/tienda';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth-service';
import { MercadoPagoService } from '../../services/mercadopago';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-admin-config',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './admin-config.html',
  styleUrl: './admin-config.scss',
})
export class AdminConfig implements OnInit {

  private tiendaService = inject(TiendaService);
  public authService = inject(AuthService);
  private mpService = inject(MercadoPagoService);
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);

  config = {
    nombre: '',
    rutEmpresa: '',
    datosBancarios: '',
    colorPrimario: '#0d6efd',
    logoUrl: ''
  };

  fileLogo: File | null = null;
  logoPreview: string | null = null;
  
  loading = false;
  mensaje = '';

  aceptaTerminos: boolean = false;

  ngOnInit() {
    this.cargarDatosActuales();
    this.verificarEstadoPago();
  }

  verificarEstadoPago() {
    const status = this.route.snapshot.queryParamMap.get('status');
    if (status === 'success') {
      console.log('💰 Pago detectado con éxito. Refrescando permisos...');
      this.authService.refreshSession().subscribe({
        next: () => {
          Swal.fire('¡Bienvenido al nivel PRO!', 'Tu suscripción se activó correctamente. Ya puedes configurar tu tienda.', 'success');
        }
      });
    }
  }

  cargarDatosActuales() {
    Swal.fire({title: 'Cargando configuración...', didOpen: () => Swal.showLoading(), timer: 1000});
    this.tiendaService.getMiTienda().subscribe({
      next: (data) => {
        this.config.nombre = data.nombre || '';
        this.config.rutEmpresa = data.rutEmpresa || '';
        this.config.datosBancarios = data.datosBancarios || '';
        this.config.colorPrimario = data.colorPrimario || '#0d6efd';
        this.config.logoUrl = data.logoUrl || '';
        this.logoPreview = data.logoUrl || null;

        if (data.fechaAceptacionTerminos) {
          this.aceptaTerminos = true;
        }
      },
      error: (err) => console.error('Error cargando tienda', err)
    });
  }

  onLogoSelected(event: any) {
    const file = event.target.files[0];
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB limit for logo

    if (file) {
      if (file.size > MAX_SIZE) {
        Swal.fire({ icon: 'error', title: 'Archivo muy pesado', text: 'El logo no debe superar los 5MB.' });
        event.target.value = '';
        return;
      }

      this.fileLogo = file;
      
      // Browser preview
      const reader = new FileReader();
      reader.onload = () => {
        this.logoPreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  guardarCambios() {
    this.loading = true;
    this.mensaje = '';

    Swal.fire({
        title: 'Guardando...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
    });

    const formData = new FormData();
    formData.append('nombreTienda', this.config.nombre);
    formData.append('rutEmpresa', this.config.rutEmpresa);
    formData.append('datosBancarios', this.config.datosBancarios);
    formData.append('colorPrimario', this.config.colorPrimario);
    formData.append('aceptaTerminos', this.aceptaTerminos.toString());

    if (this.fileLogo) formData.append('fotoLogo', this.fileLogo);

    this.tiendaService.actualizarConfiguracion(formData).subscribe({
      next: () => {
        this.loading = false;
        Swal.fire('¡Guardado!', 'La configuración se actualizó correctamente.', 'success');
      },
      error: (err) => {
        this.loading = false;
        console.error(err);
        const errorMsg = err.error?.message || 'No se pudieron guardar los cambios.';
        Swal.fire('Error', errorMsg, 'error');
      }
    });
  }

  suscribirse() {
    this.mpService.showPricingModal().then(result => {
      if (result) {
        if (result.recurring) {
          this.procesarSuscripcion();
        } else {
          this.procesarPago(result.months);
        }
      }
    });
  }

  procesarSuscripcion() {
    Swal.fire({
      title: 'Iniciando Suscripción Automática...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    this.mpService.createSubscription().subscribe({
      next: (res) => {
        if (res.id) {
          window.location.href = res.id;
        }
      },
      error: (err) => {
        console.error(err);
        Swal.fire('Error', 'No se pudo iniciar el proceso de suscripción.', 'error');
      }
    });
  }

  procesarPago(months: number) {
    Swal.fire({
      title: 'Redirigiendo a Mercado Pago...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    this.mpService.createSubscriptionPreference(months).subscribe({
      next: (res) => {
        if (res.id) {
          window.location.href = res.id;
        }
      },
      error: (err) => {
        console.error(err);
        Swal.fire('Error', 'No se pudo iniciar el proceso de pago con Mercado Pago.', 'error');
      }
    });
  }
}
