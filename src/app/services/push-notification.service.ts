import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SwPush } from '@angular/service-worker';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import Swal from 'sweetalert2';

@Injectable({ providedIn: 'root' })
export class PushNotificationService {
  private http = inject(HttpClient);
  private swPush = inject(SwPush);
  
  // VAPID Public Key matched with the backend application.properties
  private readonly VAPID_PUBLIC_KEY = 'BBz5RsE31badnMbRaKxRRwvhMAE2YPlBoUD_A4w--zN6cKgcx5KBv2WDEavc4yYqKMT03v_TG2VZluUolJd-GR8';

  suscribirAMensajes() {
    if (!this.swPush.isEnabled) {
      Swal.fire('Atención', 'Las notificaciones Push no están disponibles en este navegador o modo (se requiere HTTPS o PWA instalada).', 'info');
      return;
    }
    
    this.swPush.requestSubscription({
      serverPublicKey: this.VAPID_PUBLIC_KEY
    })
    .then(sub => {
      this.enviarSuscripcionBackend(sub).subscribe({
        next: () => Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Notificaciones Activadas', showConfirmButton: false, timer: 3000 }),
        error: (err) => console.error('Error enviando suscripción al servidor', err)
      });
    })
    .catch(err => {
      console.error("No se pudo suscribir", err);
      Swal.fire({ toast: true, position: 'top-end', icon: 'error', title: 'Permiso Denegado', showConfirmButton: false, timer: 3000 });
    });
  }

  private enviarSuscripcionBackend(sub: PushSubscription): Observable<any> {
    return this.http.post(`${environment.apiUrl}/push/suscribir`, sub);
  }
}
