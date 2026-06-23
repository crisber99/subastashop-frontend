import { Component, ElementRef, EventEmitter, Input, Output, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-image-blur-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './image-blur-modal.html',
  styleUrls: ['./image-blur-modal.scss']
})
export class ImageBlurModalComponent implements AfterViewInit {
  @ViewChild('mainCanvas') mainCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('container') container!: ElementRef<HTMLDivElement>;

  @Input() isVisible = false;
  @Input() fileIndex: number = -1;
  @Output() onSave = new EventEmitter<{ file: File, index: number }>();
  @Output() onCancel = new EventEmitter<void>();

  brushSize = 25;
  isDrawing = false;
  
  private ctx!: CanvasRenderingContext2D;
  private imageObj = new Image();
  private originalFile: File | null = null;

  // Off-screen canvases
  private baseCanvas = document.createElement('canvas');
  private baseCtx = this.baseCanvas.getContext('2d')!;
  
  private blurredCanvas = document.createElement('canvas');
  private blurredCtx = this.blurredCanvas.getContext('2d')!;
  
  private maskCanvas = document.createElement('canvas');
  private maskCtx = this.maskCanvas.getContext('2d')!;

  private lastPosition = { x: 0, y: 0 };

  ngAfterViewInit() {
    this.ctx = this.mainCanvas.nativeElement.getContext('2d')!;
  }

  open(file: File, index: number) {
    this.originalFile = file;
    this.fileIndex = index;
    this.isVisible = true;
    this.clearMask(); // reset everything

    // Load image
    const reader = new FileReader();
    reader.onload = (e) => {
      this.imageObj.onload = () => {
        this.setupCanvases();
        this.renderCanvas();
      };
      this.imageObj.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  private setupCanvases() {
    // Determine canvas dimensions based on image and container size
    const containerWidth = this.container.nativeElement.clientWidth - 30; // padding
    const containerHeight = window.innerHeight * 0.6; // max height 60vh
    
    let w = this.imageObj.width;
    let h = this.imageObj.height;
    
    // Scale down if image is too large
    if (w > containerWidth || h > containerHeight) {
      const ratio = Math.min(containerWidth / w, containerHeight / h);
      w = w * ratio;
      h = h * ratio;
    }

    const canvases = [this.mainCanvas.nativeElement, this.baseCanvas, this.blurredCanvas, this.maskCanvas];
    canvases.forEach(c => {
      c.width = w;
      c.height = h;
    });

    // Draw base
    this.baseCtx.drawImage(this.imageObj, 0, 0, w, h);

    // Draw fully blurred image
    this.blurredCtx.filter = 'blur(15px)';
    this.blurredCtx.drawImage(this.imageObj, 0, 0, w, h);
    this.blurredCtx.filter = 'none';

    // Clear mask
    this.clearMask(false);
  }

  clearMask(reRender = true) {
    if (this.maskCanvas.width > 0) {
      this.maskCtx.clearRect(0, 0, this.maskCanvas.width, this.maskCanvas.height);
    }
    if (reRender) {
      this.renderCanvas();
    }
  }

  private getPosition(event: MouseEvent | TouchEvent) {
    const rect = this.mainCanvas.nativeElement.getBoundingClientRect();
    let clientX, clientY;

    if (event instanceof TouchEvent) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else {
      clientX = event.clientX;
      clientY = event.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }

  startDrawing(event: MouseEvent | TouchEvent) {
    event.preventDefault(); // Prevent scrolling on touch
    this.isDrawing = true;
    this.lastPosition = this.getPosition(event);
    
    // Draw a single dot in case of a simple click/tap
    this.maskCtx.beginPath();
    this.maskCtx.arc(this.lastPosition.x, this.lastPosition.y, this.brushSize, 0, Math.PI * 2);
    this.maskCtx.fillStyle = 'black';
    this.maskCtx.fill();
    this.maskCtx.closePath();
    
    this.renderCanvas();
  }

  draw(event: MouseEvent | TouchEvent) {
    if (!this.isDrawing) return;
    event.preventDefault();

    const currentPosition = this.getPosition(event);

    this.maskCtx.beginPath();
    this.maskCtx.moveTo(this.lastPosition.x, this.lastPosition.y);
    this.maskCtx.lineTo(currentPosition.x, currentPosition.y);
    this.maskCtx.strokeStyle = 'black';
    this.maskCtx.lineWidth = this.brushSize * 2;
    this.maskCtx.lineCap = 'round';
    this.maskCtx.lineJoin = 'round';
    this.maskCtx.stroke();
    this.maskCtx.closePath();

    this.lastPosition = currentPosition;
    this.renderCanvas();
  }

  stopDrawing() {
    this.isDrawing = false;
  }

  private renderCanvas() {
    // 1. Clear display
    this.ctx.clearRect(0, 0, this.mainCanvas.nativeElement.width, this.mainCanvas.nativeElement.height);
    
    // 2. Draw base
    this.ctx.drawImage(this.baseCanvas, 0, 0);

    // 3. Compose blurred image + mask on a temp canvas
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = this.baseCanvas.width;
    tempCanvas.height = this.baseCanvas.height;
    const tempCtx = tempCanvas.getContext('2d')!;

    tempCtx.drawImage(this.blurredCanvas, 0, 0);
    tempCtx.globalCompositeOperation = 'destination-in';
    tempCtx.drawImage(this.maskCanvas, 0, 0);

    // 4. Draw composed result onto main canvas
    this.ctx.drawImage(tempCanvas, 0, 0);
  }

  cancel() {
    this.isVisible = false;
    this.onCancel.emit();
  }

  save() {
    Swal.fire({ title: 'Procesando...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    
    this.mainCanvas.nativeElement.toBlob((blob) => {
      Swal.close();
      if (!blob) {
        Swal.fire('Error', 'No se pudo generar la imagen.', 'error');
        return;
      }
      
      const fileExt = this.originalFile?.name.split('.').pop() || 'png';
      const newFile = new File([blob], `blurred-${Date.now()}.${fileExt}`, { type: blob.type });
      
      this.isVisible = false;
      this.onSave.emit({ file: newFile, index: this.fileIndex });
    }, this.originalFile?.type || 'image/png', 0.9);
  }
}
