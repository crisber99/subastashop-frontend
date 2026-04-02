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

  showPricingModal(): Promise<number | null> {
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
                <div class="small text-muted">Pago único mensual</div>
              </div>
            </div>
            <div class="col-md-6 col-12">
              <div class="plan-card p-3 border rounded text-center h-100" id="plan-3" style="cursor:pointer; transition: all 0.2s;">
                <h5 class="mb-1">3 Meses</h5>
                <div class="h4 mb-2">$26.970</div>
                <div class="badge bg-primary-subtle text-primary border border-primary-subtle mb-2">Ahorra 10%</div>
                <div class="small text-muted">Pago único trimestral</div>
              </div>
            </div>
            <div class="col-md-6 col-12">
              <div class="plan-card p-3 border rounded text-center h-100" id="plan-6" style="cursor:pointer; transition: all 0.2s;">
                <h5 class="mb-1">6 Meses</h5>
                <div class="h4 mb-2">$50.940</div>
                <div class="badge bg-info-subtle text-info border border-info-subtle mb-2">Ahorra 15%</div>
                <div class="small text-muted">Pago único semestral</div>
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
          <p class="mt-4 small text-muted text-center">*Oferta de $4.990 vigente por lanzamiento o hasta agotar cupos.</p>
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
    }).then((result: any) => {
      if (result.isConfirmed) {
        return result.value;
      }
      return null;
    });
  }
}
