import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-legal-terms',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="legal-container p-3 border rounded-3 bg-card-custom shadow-sm">
      <h6 class="fw-bold mb-3">Términos y Condiciones Legales (Chile) - SubastaShop</h6>
      
      <p><strong>1. Concursos de Habilidad:</strong> De acuerdo con la Ley N° 19.995 y el Código Civil chileno, los concursos ofrecidos en esta plataforma (Memorice) corresponden a <strong>Juegos de Destreza y Habilidad</strong>. El resultado depende exclusivamente de la memoria y rapidez del participante, por lo que no constituyen juegos de azar ni están sujetos a la fiscalización de la Superintendencia de Casinos de Juego.</p>

      <p><strong>2. Garantía Legal y Responsabilidad del Vendedor:</strong> Conforme a la Ley N° 19.496, el vendedor de cada producto es responsable solidario de la <strong>Garantía Legal</strong> de 6 meses ante fallas o defectos de fabricación. SubastaShop actúa únicamente como intermediario tecnológico entre el vendedor y el participante/comprador.</p>

      <p><strong>3. Exención de Responsabilidad por Despachos:</strong> SubastaShop no se hace responsable por daños, pérdidas, extravíos o demoras en los envíos gestionados por servicios de courier externos o logística propia de los vendedores. La responsabilidad del despacho recae íntegramente en el remitente y la empresa de transporte.</p>

      <p><strong>4. Firma Digital y Consentimiento:</strong> Al marcar la casilla de aceptación, usted otorga su consentimiento expreso y firma digital simple, aceptando que registremos su dirección IP, User-Agent y marca de tiempo para efectos de validez legal ante el SERNAC o tribunales de justicia.</p>
      
      <p class="text-muted small italic">Versión de Términos: v1.0 | Última actualización: Abril 2026</p>
    </div>
  `,
  styles: [`
    .legal-container { 
      text-align: justify; 
      max-height: 300px; 
      overflow-y: auto; 
      font-size: 0.9rem; 
      line-height: 1.5;
      backdrop-filter: blur(5px);
      background: var(--card-bg);
      color: var(--text-color);
      border-color: var(--border-color) !important;
    }

    .legal-container::-webkit-scrollbar { width: 6px; }
    .legal-container::-webkit-scrollbar-thumb { 
      background: var(--border-color); 
      border-radius: 10px; 
    }

    body.dark-theme .legal-container {
      background: rgba(15, 23, 42, 0.8) !important;
      color: #ffffff !important;
    }
  `]
})
export class LegalTermsComponent {
  @Input() version: string = 'v1.0';
}
