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
  showCardForm: boolean = false;
  cardPaymentBrickController: any = null;

  ngOnInit() {
    this.cargarDatosActuales();
    this.verificarEstadoPago();

    // Si venimos del banner con la intención de suscribirnos, abrimos el formulario de tarjeta
    this.route.queryParams.subscribe(params => {
      if (params['action'] === 'subscribe') {
        this.inicializarCardBrick();
      }
    });
  }

  cancelarSuscripcion() {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Tu suscripción PRO se cancelará y no se realizarán más cobros automáticos.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, anular suscripción',
      cancelButtonText: 'Mantener suscripción'
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: 'Cancelando...',
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading()
        });

        this.mpService.cancelSubscription().subscribe({
          next: () => {
            Swal.fire('Cancelada', 'Tu suscripción ha sido anulada con éxito.', 'success').then(() => {
              this.authService.refreshSession().subscribe(() => {
                window.location.reload();
              });
            });
          },
          error: (err: any) => {
            console.error('Error al cancelar', err);
            Swal.fire('Error', 'No se pudo cancelar la suscripción. Inténtalo más tarde.', 'error');
          }
        });
      }
    });
  }

  async inicializarCardBrick() {
    this.showCardForm = true;
    
    // Pequeño delay para asegurar que el contenedor #cardPaymentBrick_container ya existe en el DOM
    setTimeout(async () => {
      const mp = new (window as any).MercadoPago(environment.mercadopagoPublicKey, {
        locale: 'es-CL'
      });
      const bricksBuilder = mp.bricks();

      const settings = {
        initialization: {
          amount: 9990, // Valor base, MP lo usa para validaciones de tarjeta
          payer: {
            email: this.authService.currentUser()?.email || '',
          },
        },
        customization: {
          visual: {
            style: {
              theme: 'default', // 'default' | 'dark' | 'bootstrap' | 'flat'
            },
          },
          paymentMethods: {
            maxInstallments: 1, // Para suscripciones suele ser 1 pago recurrente
          }
        },
        callbacks: {
          onReady: () => {
            console.log('Brick is ready');
          },
          onSubmit: (formData: any) => {
            return this.procesarSuscripcionConToken(formData.token);
          },
          onError: (error: any) => {
            console.error('Brick Error:', error);
            Swal.fire('Error', 'Hubo un problema al cargar el formulario de pago.', 'error');
          },
        },
      };

      this.cardPaymentBrickController = await bricksBuilder.create(
        'cardPayment',
        'cardPaymentBrick_container',
        settings
      );
    }, 200);
  }

  procesarSuscripcionConToken(token: string) {
    return new Promise((resolve, reject) => {
      Swal.fire({
        title: 'Procesando suscripción...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      this.http.post(`${environment.apiUrl}/mercadopago/subscribe-with-token`, { token }).subscribe({
        next: (res: any) => {
          if (res.status === 'authorized' || res.status === 'active') {
            Swal.fire('¡Éxito!', 'Tu suscripción PRO ha sido activada correctamente.', 'success').then(() => {
              this.authService.refreshSession().subscribe(() => {
                window.location.reload();
              });
            });
            resolve(res);
          } else {
            Swal.fire('Atención', 'El pago está en proceso o requiere validación adicional.', 'info');
            resolve(res);
          }
        },
        error: (err) => {
          console.error('Error suscribiendo con token', err);
          Swal.fire('Error', err.error?.message || 'No se pudo procesar el pago.', 'error');
          reject(err);
        }
      });
    });
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
