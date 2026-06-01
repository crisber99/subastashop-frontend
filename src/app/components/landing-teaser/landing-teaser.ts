import { Component, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';
import Swal from 'sweetalert2';
import { AuthService } from '../../services/auth-service';
import { ProductService } from '../../services/product';

@Component({
  selector: 'app-landing-teaser',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './landing-teaser.html',
  styleUrl: './landing-teaser.scss'
})
export class LandingTeaser implements OnDestroy {
  private http = inject(HttpClient);
  public authService = inject(AuthService);

  email = signal('');
  loading = signal(false);

  // Fecha de lanzamiento objetivo
  targetDate = new Date('2026-05-31T20:00:00').getTime();

  days = signal('00');
  hours = signal('00');
  minutes = signal('00');
  seconds = signal('00');

  private timerInterval: any;

  // Si el usuario presiona una combinación secreta o es super admin
  bypassed = signal(false);

  freeWinners = signal<string[]>([]);
  discountWinners = signal<string[]>([]);

  private productService = inject(ProductService);

  constructor() {
    this.startCountdown();
    //this.cargarGanadores();
  }

  cargarGanadores() {
    this.productService.getPrelaunchWinners().subscribe({
      next: (res) => {
        const all = res || [];
        this.freeWinners.set(all.slice(0, 10));
        this.discountWinners.set(all.slice(10, 110));
      },
      error: (err) => console.error('Error al cargar ganadores:', err)
    });
  }

  ngOnDestroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  startCountdown() {
    const checkTime = () => {
      const now = new Date().getTime();
      const distance = this.targetDate - now;

      if (distance <= 0) {
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.days.set('00');
        this.hours.set('00');
        this.minutes.set('00');
        this.seconds.set('00');
        // Cuando llega a 0, ocultamos el teaser para que entren a la página
        this.bypassed.set(true);
        return false;
      }

      this.days.set(Math.floor(distance / (1000 * 60 * 60 * 24)).toString().padStart(2, '0'));
      this.hours.set(Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)).toString().padStart(2, '0'));
      this.minutes.set(Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0'));
      this.seconds.set(Math.floor((distance % (1000 * 60)) / 1000).toString().padStart(2, '0'));
      return true;
    };

    if (checkTime()) {
      this.timerInterval = setInterval(checkTime, 1000);
    }
  }

  subscribe() {
    if (!this.email()) {
      Swal.fire('Atención', 'Por favor ingresa un correo válido', 'warning');
      return;
    }

    this.loading.set(true);
    this.http.post<{ message: string }>(`${environment.apiUrl}/public/prelaunch/subscribe`, { email: this.email() })
      .subscribe({
        next: (res) => {
          this.loading.set(false);
          Swal.fire('¡Anotado!', res.message, 'success');
          this.email.set('');
        },
        error: (err) => {
          this.loading.set(false);
          Swal.fire('Error', 'Hubo un problema al registrarte. Intenta de nuevo.', 'error');
        }
      });
  }

  secretBypass() {
    // Permite ocultar el teaser para desarrollar
    this.bypassed.set(true);
  }
}
