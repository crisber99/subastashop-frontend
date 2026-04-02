import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { TiendaService } from '../../services/tienda';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth-service';
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
    Swal.fire({
      title: 'Selecciona tu Plan Pro',
      html: `
        <div class="container-fluid">
          <p class="text-center mb-4">Elige la duración de tu suscripción para desbloquear tu tienda:</p>
          <div class="row g-3">
            <div class="col-md-6">
              <div class="plan-card p-3 border rounded text-center h-100" id="plan-1" style="cursor:pointer; transition: all 0.2s;">
                <h5 class="mb-1">1 Mes</h5>
                <div class="h4 mb-1">$9.990</div>
                <div class="badge bg-success-subtle text-success border border-success-subtle mb-2">Oferta: $4.990*</div>
                <div class="small text-muted">Pago único mensual</div>
              </div>
            </div>
            <div class="col-md-6">
              <div class="plan-card p-3 border rounded text-center h-100" id="plan-3" style="cursor:pointer; transition: all 0.2s;">
                <h5 class="mb-1">3 Meses</h5>
                <div class="h4 mb-2">$26.970</div>
                <div class="badge bg-primary-subtle text-primary border border-primary-subtle mb-2">Ahorra 10%</div>
                <div class="small text-muted">Pago único trimestral</div>
              </div>
            </div>
            <div class="col-md-6">
              <div class="plan-card p-3 border rounded text-center h-100" id="plan-6" style="cursor:pointer; transition: all 0.2s;">
                <h5 class="mb-1">6 Meses</h5>
                <div class="h4 mb-2">$50.940</div>
                <div class="badge bg-info-subtle text-info border border-info-subtle mb-2">Ahorra 15%</div>
                <div class="small text-muted">Pago único semestral</div>
              </div>
            </div>
            <div class="col-md-6">
              <div class="plan-card p-3 border border-warning rounded text-center h-100 shadow-sm" id="plan-12" style="cursor:pointer; transition: all 0.2s;">
                <h5 class="mb-1 fw-bold">12 Meses</h5>
                <div class="h4 mb-2">$99.900</div>
                <div class="badge bg-warning-subtle text-warning border border-warning-subtle mb-2">2 Meses Gratis 🎁</div>
                <div class="small text-muted">Mejor valor anual</div>
              </div>
            </div>
          </div>
          <p class="mt-4 small text-muted">*Oferta de $4.990 vigente por lanzamiento o hasta agotar cupos.</p>
        </div>
        <style>
          .plan-card:hover { transform: translateY(-3px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); border-color: #6366f1 !important; }
          .plan-card.selected { border-color: #6366f1 !important; background-color: #f5f3ff; border-width: 2px !important; }
        </style>
      `,
      showCancelButton: true,
      confirmButtonText: 'Continuar al Pago 🚀',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#6366f1',
      width: '700px',
      didOpen: () => {
        const cards = document.querySelectorAll('.plan-card');
        let selectedMonths = 1;
        cards[0].classList.add('selected'); // Default

        cards.forEach(card => {
          card.addEventListener('click', () => {
            cards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            selectedMonths = parseInt(card.id.split('-')[1]);
            (Swal as any).selectedMonths = selectedMonths;
          });
        });
        (Swal as any).selectedMonths = 1;
      },
      preConfirm: () => {
        return (Swal as any).selectedMonths || 1;
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.procesarPago(result.value);
      }
    });
  }

  procesarPago(months: number) {
    Swal.fire({
      title: 'Redirigiendo a Mercado Pago...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    this.http.post<any>(`${environment.apiUrl}/mercadopago/create-preference`, { months }).subscribe({
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
