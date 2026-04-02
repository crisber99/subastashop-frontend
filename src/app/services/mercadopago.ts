import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class MercadoPagoService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/mercadopago`;

  createSubscriptionPreference(months: number = 1): Observable<{id: string}> {
    return this.http.post<{id: string}>(`${this.apiUrl}/create-preference`, { months });
  }

  createSubscription(): Observable<{id: string}> {
    return this.http.post<{id: string}>(`${this.apiUrl}/create-subscription`, {});
  }

  showPricingModal(): Promise<{months: number, recurring: boolean} | null> {
    return Swal.fire({
      title: '🚀 Selecciona tu Plan Pro',
      html: `
        <div class="container-fluid text-start">
          <p class="text-center mb-4">Desbloquea tu tienda hoy con la opción que más te convenga:</p>
          <div class="row g-3">
            <div class="col-md-6 col-12">
              <div class="plan-card p-3 border rounded text-center h-100" id="plan-1" style="cursor:pointer; transition: all 0.2s;">
                <h5 class="mb-1">1 Mes</h5>
                <div class="h4 mb-1">$9.990</div>
                <div class="badge bg-success-subtle text-success border border-success-subtle mb-2">Oferta: $4.990*</div>
                <div class="small text-muted">Ideal para empezar</div>
              </div>
            </div>
            <div class="col-md-6 col-12">
              <div class="plan-card p-3 border rounded text-center h-100" id="plan-3" style="cursor:pointer; transition: all 0.2s;">
                <h5 class="mb-1">3 Meses</h5>
                <div class="h4 mb-2">$26.970</div>
                <div class="badge bg-primary-subtle text-primary border border-primary-subtle mb-2">Ahorra 10%</div>
                <div class="small text-muted">Pago trimestral</div>
              </div>
            </div>
            <div class="col-md-6 col-12">
              <div class="plan-card p-3 border rounded text-center h-100" id="plan-6" style="cursor:pointer; transition: all 0.2s;">
                <h5 class="mb-1">6 Meses</h5>
                <div class="h4 mb-2">$50.940</div>
                <div class="badge bg-info-subtle text-info border border-info-subtle mb-2">Ahorra 15%</div>
                <div class="small text-muted">Pago semestral</div>
              </div>
            </div>
            <div class="col-md-6 col-12">
              <div class="plan-card p-3 border border-warning rounded text-center h-100 shadow-sm" id="plan-12" style="cursor:pointer; transition: all 0.2s;">
                <h5 class="mb-1 fw-bold">12 Meses</h5>
                <div class="h4 mb-2">$99.900</div>
                <div class="badge bg-warning-subtle text-warning border border-warning-subtle mb-2">2 Meses Gratis 🎁</div>
                <div class="small text-muted">Mejor valor anual</div>
              </div>
            </div>
          </div>

          <!-- Toggle de Renovación Automática -->
          <div class="mt-4 p-3 rounded border" id="recurring-toggle-container" style="background-color: rgba(99, 102, 241, 0.05);">
            <div class="form-check form-switch d-flex align-items-center justify-content-between">
              <div>
                <label class="form-check-label fw-bold mb-0" for="recurringSwitch" style="color: inherit;">Renovación Automática 🔄</label>
                <div class="small" style="opacity: 0.8;">Evita que tu tienda se desactive. Cobro mensual automático.</div>
              </div>
              <input class="form-check-input ms-3" type="checkbox" role="switch" id="recurringSwitch" style="width: 3em; height: 1.5em; cursor: pointer;">
            </div>
          </div>

          <p class="mt-4 small text-center" style="opacity: 0.6;">*Oferta de $4.990 vigente por lanzamiento o hasta agotar cupos.</p>
        </div>
        <style>
          .plan-card { color: inherit; background: transparent; }
          .plan-card:hover { transform: translateY(-3px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); border-color: #6366f1 !important; }
          .plan-card.selected { border-color: #6366f1 !important; background-color: rgba(99, 102, 241, 0.1) !important; border-width: 2px !important; }
          .plan-card .h4 { font-weight: bold; }
          #recurring-toggle-container { transition: all 0.3s ease; }
          #recurring-toggle-container.disabled { opacity: 0.3; pointer-events: none; filter: grayscale(1); }
          .swal2-html-container { color: inherit !important; }
        </style>
      `,
      showCancelButton: true,
      confirmButtonText: 'Continuar al Pago 🚀',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#6366f1',
      width: '700px',
      didOpen: () => {
        const cards = document.querySelectorAll('.plan-card');
        const recurringSwitch = document.getElementById('recurringSwitch') as HTMLInputElement;
        const toggleContainer = document.getElementById('recurring-toggle-container');
        
        let selectedMonths = 1;
        cards[0].classList.add('selected'); // Default 1 month

        cards.forEach(card => {
          card.addEventListener('click', () => {
            cards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            selectedMonths = parseInt(card.id.split('-')[1]);
            (Swal as any).selectedMonths = selectedMonths;

            // La renovación automática solo aplica al plan de 1 mes en este diseño
            if (selectedMonths !== 1) {
              if (recurringSwitch) recurringSwitch.checked = false;
              toggleContainer?.classList.add('disabled');
            } else {
              toggleContainer?.classList.remove('disabled');
            }
          });
        });

        (Swal as any).selectedMonths = 1;
        (Swal as any).recurring = false;

        recurringSwitch?.addEventListener('change', () => {
            (Swal as any).recurring = recurringSwitch.checked;
        });
      },
      preConfirm: () => {
        return {
          months: (Swal as any).selectedMonths || 1,
          recurring: (Swal as any).recurring || false
        };
      }
    }).then((result: any) => {
      if (result.isConfirmed) {
        return result.value;
      }
      return null;
    });
  }

  /**
   * Abre un popup de SweetAlert2 que contiene el Card Brick de Mercado Pago.
   * Esto permite pagar sin salir de la página actual.
   */
  showCardPaymentModal(amount: number, userEmail: string, publicKey: string): Promise<any> {
    return new Promise((resolve, reject) => {
      Swal.fire({
        title: '💳 Datos de tu Tarjeta',
        html: `
          <div id="cardPaymentBrick_container_modal" style="min-height: 400px;"></div>
          <p class="small text-muted mt-2">Tus datos están protegidos por Mercado Pago</p>
        `,
        showConfirmButton: false,
        showCancelButton: true,
        cancelButtonText: 'Cancelar',
        width: '550px',
        didOpen: async () => {
          try {
            const mp = new (window as any).MercadoPago(publicKey, { locale: 'es-CL' });
            const bricksBuilder = mp.bricks();

            await bricksBuilder.create('cardPayment', 'cardPaymentBrick_container_modal', {
              initialization: {
                amount: amount,
                payer: { email: userEmail },
              },
              customization: {
                visual: { style: { theme: 'default' } },
                paymentMethods: { maxInstallments: 1 }
              },
              callbacks: {
                onReady: () => console.log('Modal Brick Ready'),
                onSubmit: (formData: any) => {
                  // Enviamos el token al servidor
                  return this.http.post(`${environment.apiUrl}/mercadopago/subscribe-with-token`, { token: formData.token })
                    .toPromise()
                    .then((res: any) => {
                      if (res.status === 'authorized' || res.status === 'active') {
                        Swal.fire('¡Éxito!', 'Tu suscripción PRO ha sido activada.', 'success').then(() => {
                          window.location.reload();
                        });
                        resolve(res);
                      } else {
                        Swal.fire('Atención', 'El pago requiere validación adicional.', 'info');
                        resolve(res);
                      }
                    })
                    .catch((err) => {
                      console.error('Error en suscripción modal', err);
                      Swal.fire('Error', err.error?.message || 'No se pudo procesar el pago.', 'error');
                      reject(err);
                    });
                },
                onError: (error: any) => {
                  console.error('Modal Brick Error:', error);
                  reject(error);
                },
              },
            });
          } catch (e) {
            console.error('Error inicializando Brick en Modal', e);
            reject(e);
          }
        }
      });
    });
  }
}
