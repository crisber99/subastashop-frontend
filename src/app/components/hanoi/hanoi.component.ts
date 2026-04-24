import { Component, Input, Output, EventEmitter, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { CdkDragDrop, moveItemInArray, transferArrayItem, DragDropModule, CdkDrag } from '@angular/cdk/drag-drop';
import Swal from 'sweetalert2';
import confetti from 'canvas-confetti';
import { environment } from '../../../environments/environment';

export interface Disk {
  size: number;
}

@Component({
  selector: 'app-hanoi',
  standalone: true,
  imports: [CommonModule, DragDropModule],
  templateUrl: './hanoi.component.html',
  styleUrl: './hanoi.component.scss'
})
export class HanoiComponent implements OnInit {
  @Input() contestId!: number;
  @Input() userId!: number;
  @Input() totalDisks: number = 3;
  @Input() contestStatus: string = 'DISPONIBLE';
  @Output() onComplete = new EventEmitter<number>();

  private http = inject(HttpClient);
  readonly environment = environment;

  // Los 3 postes
  pegs: Disk[][] = [[], [], []];
  
  moves: number = 0;
  startTime: number = 0;
  endTime: number = 0;
  timerInterval: any;
  elapsedTime: number = 0;

  gameStarted: boolean = false;
  gameFinished: boolean = false;
  isProcessing: boolean = false;
  
  // Security token de inicio
  gameToken: string | null = null;
  serverTimeMs: number = 0;

  get isBlocked(): boolean {
    const blockedStates = ['FINALIZADO', 'GANADORES_DEFINIDOS', 'ESPERANDO_APROBACION', 'VERIFICADO', 'CERRADO'];
    return blockedStates.includes(this.contestStatus?.toUpperCase());
  }

  ngOnInit() {
    this.initGame();
  }

  initGame() {
    this.pegs = [[], [], []];
    // Rellenamos el primer poste de mayor a menor size
    for (let i = this.totalDisks; i > 0; i--) {
      this.pegs[0].push({ size: i });
    }
    this.moves = 0;
    this.gameStarted = false;
    this.gameFinished = false;
    this.elapsedTime = 0;
    this.gameToken = null;
    clearInterval(this.timerInterval);
  }

  startGame() {
    if (this.isBlocked || this.gameStarted) return;
    
    this.isProcessing = true;
    Swal.fire({ title: 'Preparando juego...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    // Request secure start token
    this.http.post<any>(`${this.environment.apiUrl}/v1/games/start/${this.contestId}`, {}).subscribe({
      next: (res) => {
        this.gameToken = res.token;
        this.serverTimeMs = res.serverTimeMs;
        this.isProcessing = false;
        
        Swal.close();
        this.gameStarted = true;
        this.startTime = Date.now();
        this.timerInterval = setInterval(() => {
          this.elapsedTime = Date.now() - this.startTime;
        }, 10);
      },
      error: (err) => {
        this.isProcessing = false;
        console.error(err);
        Swal.fire('Error', 'No se pudo iniciar el juego de forma segura.', 'error');
      }
    });
  }

  // --- Reglas de Hanói para Drag & Drop --- //

  // Evalúa si un disco particular puede ser arrastrado (solo el de encima)
  canDrag(item: CdkDrag<Disk>, currentPeg: Disk[]) {
    // Si el disco que se intenta mover es el último (es decir, el superior), se permite.
    if (!this.gameStarted || this.gameFinished) return false;
    return item.data === currentPeg[currentPeg.length - 1];
  }

  // Se dispara al soltar el disco
  drop(event: CdkDragDrop<Disk[]>) {
    if (event.previousContainer === event.container) {
      return; // Soltado en el mismo sitio
    }

    const draggedDisk = event.item.data as Disk;
    const targetPeg = event.container.data;
    
    // Regla fundamental: Un disco más grande no puede descansar sobre uno más pequeño
    if (targetPeg.length > 0) {
      const topDisk = targetPeg[targetPeg.length - 1];
      if (draggedDisk.size >= topDisk.size) {
        // Bloquear drop y animar error visual si es posible
        this.animarErrorMovimiento();
        return; 
      }
    }

    // Movimiento válido
    transferArrayItem(
      event.previousContainer.data,
      event.container.data,
      event.previousIndex,
      event.container.data.length
    );

    this.moves++;
    this.checkWinCondition();
  }

  // Predicado del contenedor para permitir o no entrada.
  // Es más suave validarlo visualmente con esto
  diskEnterPredicate = (drag: CdkDrag<Disk>, drop: any): boolean => {
    const targetPeg = drop.data as Disk[];
    if (targetPeg.length === 0) return true;
    const topDisk = targetPeg[targetPeg.length - 1];
    return drag.data.size < topDisk.size;
  }

  animarErrorMovimiento() {
     // Optional UX effect
     console.log("Movimiento ilegal bloqueado");
  }

  checkWinCondition() {
    // Ganador si el último poste tiene todos los discos
    if (this.pegs[2].length === this.totalDisks) {
      this.finishGame();
    }
  }

  finishGame() {
    this.gameFinished = true;
    this.endTime = Date.now();
    clearInterval(this.timerInterval);
    const totalTime = this.endTime - this.startTime;

    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    this.submitScore(totalTime);
  }

  submitScore(totalTime: number) {
    this.isProcessing = true;
    if (!this.gameToken) {
        Swal.fire('Error Grave', 'Falta el token de seguridad. Tu partida no es válida.', 'error');
        return;
    }

    const apiUrl = `${this.environment.apiUrl}/v1/games/submit/${this.contestId}`;
    
    this.http.post(apiUrl, {
      token: this.gameToken,
      timeMs: totalTime,
      moves: this.moves
    }).subscribe({
      next: () => {
        this.isProcessing = false;
        Swal.fire({
          title: '¡Resolución Exitosa! 🧠',
          text: `Completaste Hanói en ${this.moves} movimientos y ${(totalTime / 1000).toFixed(2)} segundos.`,
          icon: 'success',
          confirmButtonText: 'Genial'
        });
        this.onComplete.emit(totalTime);
      },
      error: (err) => {
        this.isProcessing = false;
        Swal.fire('Validación Fallida', err.error?.error || 'Tu tiempo fue rechazado por el servidor.', 'error');
      }
    });
  }

  formatTime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const milliseconds = Math.floor((ms % 1000) / 10);
    return `${seconds}.${milliseconds.toString().padStart(2, '0')}s`;
  }
}
