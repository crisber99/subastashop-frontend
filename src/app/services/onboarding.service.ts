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
          element: '#navbar-search', // Asumimos que el buscador tiene este ID o lo agregaremos
          title: 'Busca Productos',
          intro: 'Aquí puedes encontrar subastas, rifas y ventas directas al instante.',
          position: 'bottom'
        },
        {
          element: '#cart-button-mobile, .cart-float-btn', // Botón de carrito
          title: 'Tu Carrito',
          intro: 'Aquí aparecerán tus reservas y compras directas.',
          position: 'left'
        },
        {
          element: '#perfil-menu', // Menú de perfil
          title: 'Tu Panel',
          intro: 'Accede a tus pujas, compras, y configura tu tienda desde tu perfil.',
          position: 'left'
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
