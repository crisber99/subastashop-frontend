import { Component, ElementRef, ViewChild, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiChatService } from '../../../services/ai-chat.service';

interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
}

@Component({
  selector: 'app-admin-data-analysis',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-data-analysis.component.html',
  styleUrls: ['./admin-data-analysis.component.css']
})
export class AdminDataAnalysisComponent {
  private aiChatService = inject(AiChatService);

  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  // --- ESTADO ---
  userInput = signal<string>('');
  isTyping = signal<boolean>(false);
  messages = signal<ChatMessage[]>([
    { role: 'ai', content: 'Bienvenido, Administrador. ¿Qué datos del sistema deseas analizar hoy? Puedo generar resúmenes de ventas, usuarios, tendencias y más.' }
  ]);

  constructor() {
    effect(() => {
      this.messages();
      setTimeout(() => this.scrollToBottom(), 50);
    });
  }

  setQuery(text: string) {
    this.userInput.set(text);
    this.startAnalysis();
  }

  startAnalysis() {
    const text = this.userInput().trim();
    if (!text) return;

    this.messages.update(prev => [...prev, { role: 'user', content: text }]);
    this.userInput.set('');
    this.isTyping.set(true);

    let aiResponseContent = '';
    const aiMessageIndex = this.messages().length;
    this.messages.update(prev => [...prev, { role: 'ai', content: '' }]);

    this.aiChatService.getStreamingAnalysisResponse(text).subscribe({
      next: (chunk) => {
        aiResponseContent += chunk;
        this.updateAiMessage(aiMessageIndex, aiResponseContent);
        this.isTyping.set(false);
      },
      error: (err) => {
        console.error('Error in Admin AI streaming:', err);
        this.updateAiMessage(aiMessageIndex, 'Ocurrió un error al analizar los datos. Por favor verifica los logs del servidor.');
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

  formatMessage(text: string): string {
    if (!text) return '';
    
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\[CONSULTA: (.*?)\]/g, '<div class="sql-box"><code>$1</code></div>') // Formato especial para SQL
      .replace(/\n/g, '<br>');
  }
}
