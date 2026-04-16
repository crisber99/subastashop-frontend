import { Component, ElementRef, ViewChild, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiChatService } from '../../services/ai-chat.service';

interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
}

@Component({
  selector: 'app-ai-support-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-support-chat.component.html',
  styleUrls: ['./ai-support-chat.component.css']
})
export class AiSupportChatComponent {
  private aiChatService = inject(AiChatService);

  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  // --- SIGNALS PARA ESTADO ---
  isOpen = signal<boolean>(false);
  isTyping = signal<boolean>(false);
  userInput = signal<string>('');
  messages = signal<ChatMessage[]>([
    { role: 'ai', content: '¡Hola! Soy tu asistente de SubastaShop. ¿En qué puedo ayudarte hoy?' }
  ]);

  constructor() {
    // Scroll automático al final cuando hay nuevos mensajes
    effect(() => {
      this.messages();
      setTimeout(() => this.scrollToBottom(), 50);
    });
  }

  toggleChat() {
    this.isOpen.update(v => !v);
  }

  sendMessage() {
    const text = this.userInput().trim();
    if (!text) return;

    // Agregar mensaje del usuario
    this.messages.update(prev => [...prev, { role: 'user', content: text }]);
    this.userInput.set('');
    this.isTyping.set(true);

    // Preparar mensaje de la IA (vacio inicialmente para streaming)
    let aiResponseContent = '';
    const aiMessageIndex = this.messages().length;
    this.messages.update(prev => [...prev, { role: 'ai', content: '' }]);

    // Iniciar streaming
    this.aiChatService.getStreamingSupportResponse(text).subscribe({
      next: (chunk) => {
        aiResponseContent += chunk;
        this.updateAiMessage(aiMessageIndex, aiResponseContent);
        this.isTyping.set(false);
      },
      error: (err) => {
        console.error('Error in AI streaming:', err);
        this.updateAiMessage(aiMessageIndex, 'Lo siento, hubo un error al procesar tu solicitud. Por favor intenta de nuevo.');
        this.isTyping.set(false);
      },
      complete: () => {
        this.isTyping.set(false);
      }
    });
  }

  private updateAiMessage(index: number, content: string) {
    this.messages.update(prev => {
      const newMessages = [...prev];
      if (newMessages[index]) {
        newMessages[index] = { ...newMessages[index], content };
      }
      return newMessages;
    });
  }

  private scrollToBottom(): void {
    if (this.scrollContainer) {
      this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
    }
  }

  // --- FORMATEADOR SIMPLE DE MARKDOWN ---
  formatMessage(text: string): string {
    if (!text) return '';
    
    let formatted = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Negrita
      .replace(/\*(.*?)\*/g, '<em>$1</em>')           // Cursiva
      .replace(/\n/g, '<br>');                        // Saltos de línea
    
    return formatted;
  }
}
