import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';
import confetti from 'canvas-confetti';

interface Card {
  id: number;
  value: string;
  flipped: boolean;
  matched: boolean;
}

@Component({
  selector: 'app-memorice',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './memorice.html',
  styleUrl: './memorice.scss'
})
export class MemoriceComponent {
  @Input() contestId!: number;
  @Input() userId!: number;
  @Input() totalPairs: number = 5;
  @Input() contestStatus: string = 'DISPONIBLE'; // Estado del concurso
  @Output() onComplete = new EventEmitter<number>();

  // Estados que bloquean el juego
  get isBlocked(): boolean {
    const blockedStates = ['FINALIZADO', 'GANADORES_DEFINIDOS', 'ESPERANDO_APROBACION', 'VERIFICADO', 'CERRADO'];
    return blockedStates.includes(this.contestStatus?.toUpperCase());
  }

  private http = inject(HttpClient);

  cards: Card[] = [];
  flippedCards: Card[] = [];
  matchedPairs: number = 0;
  
  startTime: number = 0;
  endTime: number = 0;
  timerInterval: any;
  elapsedTime: number = 0;
  
  gameStarted: boolean = false;
  gameFinished: boolean = false;
  isProcessing: boolean = false;

  private cardValues = ['💎', '🔥', '🚀', '⭐', '🌈', '🧩', '🎨', '🎬', '🎧', '🎸', '🎹', '🎮', '💡', '🔔', '👑'];

  constructor() {
    this.initGame();
  }

  initGame() {
    this.cards = [];
    // Seleccionar solo los pares necesarios según totalPairs
    const selectedValues = this.cardValues.slice(0, this.totalPairs);
    const values = [...selectedValues, ...selectedValues];
    this.shuffle(values);
    
    this.cards = values.map((val, index) => ({
      id: index,
      value: val,
      flipped: false,
      matched: false
    }));
    
    this.matchedPairs = 0;
    this.gameStarted = false;
    this.gameFinished = false;
    this.elapsedTime = 0;
    clearInterval(this.timerInterval);
  }

  shuffle(array: any[]) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  flipCard(card: Card) {
    if (this.isBlocked || this.gameFinished || card.flipped || card.matched || this.flippedCards.length >= 2) return;

    if (!this.gameStarted) {
      this.startTimer();
    }

    card.flipped = true;
    this.flippedCards.push(card);

    if (this.flippedCards.length === 2) {
      this.checkMatch();
    }
  }

  startTimer() {
    this.gameStarted = true;
    this.startTime = Date.now();
    this.timerInterval = setInterval(() => {
      this.elapsedTime = Date.now() - this.startTime;
    }, 10);
  }

  checkMatch() {
    const [card1, card2] = this.flippedCards;

    if (card1.value === card2.value) {
      card1.matched = true;
      card2.matched = true;
      this.matchedPairs++;
      this.flippedCards = [];

      if (this.matchedPairs === this.totalPairs) {
        this.finishGame();
      }
    } else {
      setTimeout(() => {
        card1.flipped = false;
        card2.flipped = false;
        this.flippedCards = [];
      }, 1000);
    }
  }

  finishGame() {
    this.gameFinished = true;
    this.endTime = Date.now();
    clearInterval(this.timerInterval);
    const totalTime = this.endTime - this.startTime;

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    this.submitScore(totalTime);
  }

  submitScore(totalTime: number) {
    this.isProcessing = true;
    const apiUrl = `/api/contests/${this.contestId}/submit-score`;
    
    this.http.post(apiUrl, {
      userId: this.userId,
      totalTimeMs: totalTime
    }).subscribe({
      next: () => {
        this.isProcessing = false;
        Swal.fire({
          title: '¡Excelente habilidad! 🏆',
          text: `Completaste el reto en ${(totalTime / 1000).toFixed(2)} segundos. Tu tiempo ha sido registrado para el concurso.`,
          icon: 'success',
          confirmButtonText: 'Genial'
        });
        this.onComplete.emit(totalTime);
      },
      error: (err) => {
        this.isProcessing = false;
        Swal.fire('Error', err.error?.error || 'No se pudo registrar tu tiempo.', 'error');
      }
    });
  }

  formatTime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const milliseconds = Math.floor((ms % 1000) / 10);
    return `${seconds}.${milliseconds.toString().padStart(2, '0')}s`;
  }
}
