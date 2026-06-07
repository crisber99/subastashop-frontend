import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import introJs from 'intro.js';

@Injectable({
  providedIn: 'root'
})
export class OnboardingService {
  private router = inject(Router);
  
  public iniciarTour() {
    const tourVisto = localStorage.getItem('tour-visto');
    if (tourVisto === 'true') {
      return; // Ya lo vio
    }

    const intro = introJs();

    intro.setOptions({
      nextLabel: 'Siguiente',
      prevLabel: 'Anterior',
      skipLabel: 'Saltar',
      doneLabel: '¡Entendido!',
      showStepNumbers: true,
      showBullets: true,
      exitOnOverlayClick: false,
      steps: [
        {
          title: '¡Bienvenido a Subasta Shop! 🎉',
          intro: 'Te daremos un rápido tour para que aprendas a usar la plataforma.',
        },
        {
          element: '#sidebar-toggle-btn', 
          title: 'Menú Principal',
          intro: 'Abre este menú para acceder a todas las opciones, incluyendo tu perfil y configuración de tienda.',
          position: 'right'
        },
        {
          element: '#cart-button-desktop', 
          title: 'Tu Carrito',
          intro: 'Aquí aparecerán tus reservas y compras directas.',
          position: 'bottom'
        }
      ]
    });

    intro.oncomplete(() => {
      localStorage.setItem('tour-visto', 'true');
    });

    intro.onskip(() => {
      localStorage.setItem('tour-visto', 'true');
    });

    // Pequeño timeout para asegurar que el DOM cargó
    setTimeout(() => {
      intro.start();
    }, 1000);
  }

  public forzarTour() {
    localStorage.removeItem('tour-visto');
    this.iniciarTour();
  }
}
