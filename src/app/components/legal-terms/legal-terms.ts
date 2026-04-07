import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-legal-terms',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="legal-container p-3 border rounded-3 bg-light shadow-sm" style="max-height: 300px; overflow-y: auto; font-size: 0.9rem; line-height: 1.5; color: #444;">
      <h6 class="fw-bold mb-3">Términos y Condiciones Legales (Chile) - SubastaShop</h6>
      
      <p><strong>1. Concursos de Habilidad:</strong> De acuerdo con la Ley N° 19.995 y el Código Civil chileno, los concursos ofrecidos en esta plataforma (Memorice) corresponden a <strong>Juegos de Destreza y Habilidad</strong>. El resultado depende exclusivamente de la memoria y rapidez del participante, por lo que no constituyen juegos de azar ni están sujetos a la fiscalización de la Superintendencia de Casinos de Juego.</p>

      <p><strong>2. Garantía Legal y Responsabilidad del Vendedor:</strong> Conforme a la Ley N° 19.496, el vendedor de cada producto es responsable solidario de la <strong>Garantía Legal</strong> de 6 meses ante fallas o defectos de fabricación. SubastaShop actúa únicamente como intermediario tecnológico entre el vendedor y el participante/comprador.</p>

      <p><strong>3. Exención de Responsabilidad por Despachos:</strong> SubastaShop no se hace responsable por daños, pérdidas, extravíos o demoras en los envíos gestionados por servicios de courier externos o logística propia de los vendedores. La responsabilidad del despacho recae íntegramente en el remitente y la empresa de transporte.</p>

      <p><strong>4. Firma Digital y Consentimiento:</strong> Al marcar la casilla de aceptación, usted otorga su consentimiento expreso y firma digital simple, aceptando que registremos su dirección IP, User-Agent y marca de tiempo para efectos de validez legal ante el SERNAC o tribunales de justicia.</p>
      
      <p class="text-muted small italic">Versión de Términos: v1.0 | Última actualización: Abril 2026</p>
    </div>
  `,
  styles: [`
    /* Estilos Base y Modo Claro (Por defecto) */
    .legal-container { 
      text-align: justify; 
      max-height: 300px; 
      overflow-y: auto; 
      font-size: 0.9rem; 
      line-height: 1.5;
      backdrop-filter: blur(5px);
      
      background: rgba(255, 255, 255, 0.8); 
      color: #333;
    }

    .legal-container::-webkit-scrollbar { width: 6px; }
    .legal-container::-webkit-scrollbar-thumb { background: #ccc; border-radius: 10px; }

    /* --- ADAPTACIÓN AL MODO OSCURO --- */
    /* Opción A: Detectar preferencia del sistema operativo */
    @media (prefers-color-scheme: dark) {
      .legal-container {
        background: rgba(30, 30, 30, 0.8); /* Fondo oscuro semitransparente */
        color: #e2e8f0; /* Texto claro */
        border-color: #475569 !important; /* Suaviza el borde de Bootstrap */
      }
      
      .legal-container::-webkit-scrollbar-thumb { 
        background: #64748b; /* Scrollbar más oscuro */
      }

      .text-muted {
        color: #94a3b8 !important; /* Ajuste para el texto inferior */
      }
    }

    /* Opción B: Si usas una clase global (ej: un botón que le pone .dark a tu body/html). 
       Si este es tu caso, borra el @media de arriba y descomenta lo siguiente: */
    
    /*
    :host-context(.dark) .legal-container,
    :host-context([data-bs-theme="dark"]) .legal-container {
      background: rgba(30, 30, 30, 0.8);
      color: #e2e8f0;
      border-color: #475569 !important;
    }
    :host-context(.dark) .legal-container::-webkit-scrollbar-thumb,
    :host-context([data-bs-theme="dark"]) .legal-container::-webkit-scrollbar-thumb {
      background: #64748b;
    }
    :host-context(.dark) .text-muted,
    :host-context([data-bs-theme="dark"]) .text-muted {
      color: #94a3b8 !important;
    }
    */
  `]
})
export class LegalTermsComponent {
  @Input() version: string = 'v1.0';
}
