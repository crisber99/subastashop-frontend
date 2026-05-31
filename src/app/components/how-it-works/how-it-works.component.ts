import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Faq {
  question: string;
  answer: string;
  isOpen: boolean;
}

@Component({
  selector: 'app-how-it-works',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './how-it-works.component.html',
  styleUrl: './how-it-works.component.scss'
})
export class HowItWorksComponent {
  faqs = signal<Faq[]>([
    {
      question: '¿Tiene costo registrarse?',
      answer: 'No, crear tu cuenta para mirar y participar es 100% GRATIS. Solo pagas si quieres publicar productos.',
      isOpen: false
    },
    {
      question: '¿Qué pasa si gano una subasta y no pago?',
      answer: 'Las pujas son un compromiso de compra. Si ganas y no pagas, tu cuenta podría ser suspendida.',
      isOpen: false
    },
    {
      question: '¿Es seguro comprar aquí?',
      answer: 'Sí, fomentamos un entorno transparente. Te recomendamos revisar la reputación del vendedor.',
      isOpen: false
    }
  ]);

  toggleFaq(index: number) {
    this.faqs.update(faqs => {
      faqs[index].isOpen = !faqs[index].isOpen;
      return [...faqs];
    });
  }
}
