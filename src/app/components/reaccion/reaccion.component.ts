import { Component, Input, Output, EventEmitter, inject, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';
import { Subscription, fromEvent, timer, of } from 'rxjs';
import { switchMap, take, takeUntil, tap, filter } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import confetti from 'canvas-confetti';

@Component({
  selector: 'app-reaccion',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reaccion.component.html',
  styleUrl: './reaccion.component.scss'
})
export class ReaccionComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() contestId!: number;
  @Input() userId!: number;
  @Input() contestStatus: string = 'DISPONIBLE';
  @Output() onComplete = new EventEmitter<number>();

  @ViewChild('reactionArea') reactionArea!: ElementRef;

  private http = inject(HttpClient);
  readonly environment = environment;

  // Estados del juego
  gameState: 'IDLE' | 'WAITING' | 'CLICK_NOW' | 'FINISHED' = 'IDLE';
  
  attemptsCount: number = 0;
  maxAttempts: number = 3;
  reactionTimes: number[] = [];
  
  // Variables RxJS & cronometraje
  private clickSub!: Subscription;
  private gameRunnerSub!: Subscription;
  private greenLightTime: number = 0;

  // Security
  gameToken: string | null = null;
  serverTimeMs: number = 0;
  isProcessing: boolean = false;

  get isBlocked(): boolean {
    const blockedStates = ['FINALIZADO', 'GANADORES_DEFINIDOS', 'ESPERANDO_APROBACION', 'VERIFICADO', 'CERRADO'];
    return blockedStates.includes(this.contestStatus?.toUpperCase());
  }

  get averageTime(): number {
    if (this.reactionTimes.length === 0) return 0;
    const sum = this.reactionTimes.reduce((a, b) => a + b, 0);
    return Math.round(sum / this.reactionTimes.length);
  }

  ngOnInit() {
     this.resetGame();
  }

  ngAfterViewInit() {
    this.setupClickListener();
  }

  ngOnDestroy() {
    this.cleanUpSubscriptions();
  }

  resetGame() {
    this.gameState = 'IDLE';
    this.attemptsCount = 0;
    this.reactionTimes = [];
    this.gameToken = null;
    this.cleanUpSubscriptions();
  }

  cleanUpSubscriptions() {
    if (this.clickSub) this.clickSub.unsubscribe();
    if (this.gameRunnerSub) this.gameRunnerSub.unsubscribe();
  }

  startGame() {
    if (this.isBlocked) return;
    
    this.isProcessing = true;
    Swal.fire({ title: 'Preparando...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    this.http.post<any>(`${this.environment.apiUrl}/v1/games/start/${this.contestId}`, {}).subscribe({
      next: (res) => {
        this.gameToken = res.token;
        this.serverTimeMs = res.serverTimeMs;
        this.isProcessing = false;
        Swal.close();
        
        this.runAttempt();
      },
      error: (err) => {
        this.isProcessing = false;
        console.error(err);
        Swal.fire('Error', 'No se pudo generar un token válido. Juega más tarde.', 'error');
      }
    });
  }

  runAttempt() {
    this.cleanUpSubscriptions();
    this.gameState = 'WAITING';

    const randomDelay = Math.floor(Math.random() * 3000) + 2000; // Entre 2 y 5 segundos

    this.gameRunnerSub = timer(randomDelay).subscribe(() => {
      this.gameState = 'CLICK_NOW';
      this.greenLightTime = performance.now();
    });

    this.setupClickListener();
  }

  setupClickListener() {
    if (!this.reactionArea) return;
    
    this.clickSub = fromEvent(this.reactionArea.nativeElement, 'touchstart').subscribe((e: any) => {
      e.preventDefault(); // Prevenir doble ghost click
      this.handleReaction();
    });

    const mouseClickSub = fromEvent(this.reactionArea.nativeElement, 'mousedown').subscribe((e) => {
      this.handleReaction();
    });

    this.clickSub.add(mouseClickSub);
  }

  handleReaction() {
    if (this.gameState === 'IDLE' || this.gameState === 'FINISHED') return;

    if (this.gameState === 'WAITING') {
      // Falso Arranque!
      this.cleanUpSubscriptions();
      Swal.fire({
        title: '¡Falso arranque!',
        text: 'Hiciste clic demasiado pronto. Se aplicará una penalización de 500ms al promedio.',
        icon: 'warning',
        confirmButtonText: 'Continuar'
      }).then(() => {
        // Añadir castigo en lugar de invalidar por completo
        this.reactionTimes.push(1500); // Penalty estándar
        this.attemptsCount++;
        this.checkGameProgress();
      });
      return;
    }

    if (this.gameState === 'CLICK_NOW') {
      const clickTime = performance.now();
      const reaction = Math.round(clickTime - this.greenLightTime);
      
      this.reactionTimes.push(reaction);
      this.attemptsCount++;
      
      this.gameState = 'IDLE'; // Pausa temporal
      this.cleanUpSubscriptions();

      if (this.attemptsCount < this.maxAttempts) {
        setTimeout(() => this.runAttempt(), 1000); // 1 segundo entre rondas
      } else {
        this.checkGameProgress();
      }
    }
  }

  checkGameProgress() {
    if (this.attemptsCount >= this.maxAttempts) {
      this.gameState = 'FINISHED';
      this.finishGame();
    } else {
       this.runAttempt();
    }
  }

  finishGame() {
    const finalAvg = this.averageTime;
    
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#5bc0de', '#5cb85c'] });
    
    this.submitScore(finalAvg);
  }

  submitScore(averageTimeMs: number) {
    this.isProcessing = true;
    if (!this.gameToken) {
        Swal.fire('Error Grave', 'Falta el token de seguridad. Tu partida no es válida.', 'error');
        return;
    }

    const apiUrl = `${this.environment.apiUrl}/v1/games/submit/${this.contestId}`;
    
    this.http.post(apiUrl, {
      token: this.gameToken,
      timeMs: averageTimeMs, // El backend verificará > 50ms para Evitar Bots
      moves: this.maxAttempts // Enviamos los intentos como "moves" referenciales
    }).subscribe({
      next: () => {
        this.isProcessing = false;
        Swal.fire({
          title: '¡Reflejos de Gato! ⚡',
          text: `Tu promedio de reacción fue de ${averageTimeMs}ms.`,
          icon: 'success',
          confirmButtonText: 'Genial'
        });
        this.onComplete.emit(averageTimeMs);
      },
      error: (err) => {
        this.isProcessing = false;
        Swal.fire('Detección Fallida', err.error?.error || 'Tu tiempo fue rechazado por anomalías.', 'error');
      }
    });
  }
}
