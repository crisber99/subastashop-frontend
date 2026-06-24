import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cookie-consent',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cookie-consent.html',
  styleUrls: ['./cookie-consent.scss']
})
export class CookieConsentComponent implements OnInit {
  mostrarBanner = false;
  mostrarConfiguracion = false;

  // Preferencias
  preferencias = {
    esenciales: true, // Siempre true
    analiticas: true,
    marketing: true
  };

  ngOnInit() {
    this.verificarConsentimiento();
  }

  verificarConsentimiento() {
    const consentimientoPrevio = localStorage.getItem('subastashop_cookie_consent');
    if (!consentimientoPrevio) {
      this.mostrarBanner = true;
    } else {
      const prefs = JSON.parse(consentimientoPrevio);
      if (prefs.analiticas || prefs.marketing) {
        this.inyectarGTM();
      }
    }
  }

  aceptarTodas() {
    this.preferencias.analiticas = true;
    this.preferencias.marketing = true;
    this.guardarYAplicar();
  }

  aceptarEsenciales() {
    this.preferencias.analiticas = false;
    this.preferencias.marketing = false;
    this.guardarYAplicar();
  }

  abrirConfiguracion() {
    this.mostrarConfiguracion = true;
  }

  cerrarConfiguracion() {
    this.mostrarConfiguracion = false;
  }

  guardarConfiguracion() {
    this.guardarYAplicar();
  }

  private guardarYAplicar() {
    localStorage.setItem('subastashop_cookie_consent', JSON.stringify(this.preferencias));
    this.mostrarBanner = false;
    this.mostrarConfiguracion = false;
    
    // Si aprueba analíticas o marketing, cargamos GTM
    if (this.preferencias.analiticas || this.preferencias.marketing) {
      this.inyectarGTM();
    }
  }

  private inyectarGTM() {
    // Evitar inyectar múltiples veces
    if (document.getElementById('gtm-script')) return;

    const gtmId = 'GTM-W4FKJRGZ';
    
    // Script principal
    const script = document.createElement('script');
    script.id = 'gtm-script';
    script.innerHTML = `
      (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
      new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
      j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
      'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
      })(window,document,'script','dataLayer','${gtmId}');
    `;
    document.head.appendChild(script);

    // Iframe de noscript (opcional pero recomendado)
    const noscript = document.createElement('noscript');
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.googletagmanager.com/ns.html?id=${gtmId}`;
    iframe.height = '0';
    iframe.width = '0';
    iframe.style.display = 'none';
    iframe.style.visibility = 'hidden';
    noscript.appendChild(iframe);
    document.body.insertBefore(noscript, document.body.firstChild);
  }

  toggleAnaliticas() {
    this.preferencias.analiticas = !this.preferencias.analiticas;
  }

  toggleMarketing() {
    this.preferencias.marketing = !this.preferencias.marketing;
  }
}
