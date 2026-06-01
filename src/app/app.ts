import { CommonModule } from '@angular/common';
import { Component, inject, effect } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth-service';
import { LayoutService } from './services/layout';
import { Loader } from './services/loader';
import { Navbar } from './components/navbar/navbar';
import { Sidebar } from './components/sidebar/sidebar';
import { FooterComponent } from './components/footer/footer';
import { CartFloat } from './components/cart-float/cart-float';
import { PromotionBanner } from './components/promotion-banner/promotion-banner';
import { AiSupportChatComponent } from './components/ai-support-chat/ai-support-chat.component';
import { Websocket } from './services/websocket';
import { LandingTeaser } from './components/landing-teaser/landing-teaser';
import { environment } from '../environments/environment';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, Sidebar, Navbar, FooterComponent, CartFloat, PromotionBanner, LandingTeaser],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  authService = inject(AuthService);
  layoutService = inject(LayoutService);
  router = inject(Router);
  loaderService = inject(Loader);
  websocketService = inject(Websocket);

  launchMode = environment.launchMode || false;

  constructor() {
    // Suscribirse a las actualizaciones globales (ej. cuando eres superado en una puja)
    this.websocketService.getGlobalUpdates().subscribe((mensaje: any) => {
      if (mensaje && mensaje.tipo === 'OUTBID') {
        Swal.fire({
          icon: 'warning',
          title: '¡Te han superado!',
          text: `Alguien hizo una oferta mayor por "${mensaje.productoNombre}". El nuevo precio es $${mensaje.nuevoPrecio}.`,
          toast: true,
          position: 'top-end',
          showConfirmButton: true,
          confirmButtonText: 'Ver Producto'
        }).then((result) => {
          if (result.isConfirmed) {
            this.router.navigate(['/producto', mensaje.productoId]);
          }
        });
      }
    });

    // Efecto reactivo: conecta/desconecta al usuario del Socket global cuando cambia el estado de Auth
    effect(() => {
      const usuario = this.authService.currentUser();
      if (usuario && usuario.id) {
        this.websocketService.conectar(() => {
          this.websocketService.suscribirseGlobal(usuario.id!);
          this.websocketService.suscribirseFundadores();
        });
      } else {
        // Si no está logueado, igual necesitamos el canal público de fundadores
        this.websocketService.conectar(() => {
          this.websocketService.suscribirseFundadores();
        });
      }
    });
  }

  isAuthPage(): boolean {
    const url = this.router.url;
    return url === '/login' || url === '/registro';
  }

  getWhatsAppUrl(): string {
    const user = this.authService.currentUser();
    let text = "Hola. Me contacto desde SubastaShop. Necesito realizar una consulta o reportar una incidencia.";
    if (user && (user.nombre || user.nombreCompleto)) {
      const nombreMostrar = user.nombreCompleto || user.nombre;
      text = `Hola, soy ${nombreMostrar} y me contacto desde SubastaShop. Necesito realizar una consulta o reportar una incidencia.`;
    }
    return `https://wa.me/56943449827?text=${encodeURIComponent(text)}`;
  }
}
