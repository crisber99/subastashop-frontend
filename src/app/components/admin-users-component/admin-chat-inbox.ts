import { Component, inject, OnInit, OnDestroy, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth-service';
import { Client, Message } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

interface MensajeChat {
  id?: string;
  contenido: string;
  remitenteNombre: string;
  productoId: number;
  tiendaId?: number;
  timestamp?: string;
  userEmail?: string;
  esVendedor?: boolean;
  admin?: boolean;
}

interface ProductoConChat {
  id: number;
  nombre: string;
  slug: string;
  chatHabilitado: boolean;
  tiendaId?: number;
  unreadCount?: number;
}

@Component({
  selector: 'app-admin-chat-inbox',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="chat-inbox-container">

      <!-- Panel izquierdo: Lista de productos con chat -->
      <div class="chat-sidebar">
        <div class="chat-sidebar-header">
          <h6 class="mb-0 fw-bold">
            <i class="bi bi-chat-dots-fill me-2 text-primary"></i>
            Conversaciones
          </h6>
          <button class="btn btn-sm btn-outline-secondary rounded-pill" (click)="cargarProductos()">
            <i class="bi bi-arrow-clockwise"></i>
          </button>
        </div>

        <div class="chat-product-list">
          <div *ngIf="cargandoProductos" class="text-center py-4">
            <div class="spinner-border spinner-border-sm text-primary" role="status"></div>
            <p class="small text-muted mt-2">Cargando...</p>
          </div>

          <div *ngIf="!cargandoProductos && productos.length === 0" class="text-center py-4 px-3">
            <i class="bi bi-chat-square-text fs-2 text-muted opacity-50"></i>
            <p class="small text-muted mt-2">No tienes productos con chat activo.</p>
          </div>

          <div *ngFor="let p of productos"
               class="chat-product-item"
               [class.active]="productoSeleccionado?.id === p.id"
               (click)="seleccionarProducto(p)">
            <div class="d-flex align-items-center gap-2">
              <div class="chat-product-icon">
                <i class="bi bi-box-seam"></i>
              </div>
              <div class="flex-grow-1 overflow-hidden">
                <p class="chat-product-name mb-0">{{ p.nombre }}</p>
                <small class="text-muted">#{{ p.id }}</small>
              </div>
              <span *ngIf="p.unreadCount && p.unreadCount > 0"
                    class="badge bg-danger rounded-pill">
                {{ p.unreadCount }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Panel derecho: Conversación -->
      <div class="chat-main">
        <div *ngIf="!productoSeleccionado" class="chat-empty-state">
          <i class="bi bi-chat-left-dots fs-1 text-muted opacity-50"></i>
          <p class="text-muted mt-3">Selecciona un producto para ver su chat</p>
        </div>

        <div *ngIf="productoSeleccionado" class="chat-window">
          <!-- Header de la conversación -->
          <div class="chat-window-header">
            <div class="d-flex align-items-center gap-3">
              <div class="chat-status-dot" [class.connected]="wsConectado"></div>
              <div>
                <p class="mb-0 fw-bold">{{ productoSeleccionado.nombre }}</p>
                <small class="text-muted">{{ wsConectado ? 'En vivo' : 'Conectando...' }}</small>
              </div>
            </div>
            <span class="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill px-3">
              <i class="bi bi-shield-check me-1"></i> Admin
            </span>
          </div>

          <!-- Mensajes -->
          <div class="chat-messages-area" id="adminChatMessages">
            <div *ngIf="cargandoMensajes" class="text-center py-4">
              <div class="spinner-border spinner-border-sm text-primary" role="status"></div>
            </div>

            <div *ngIf="!cargandoMensajes && mensajes.length === 0" class="chat-empty-messages">
              <i class="bi bi-chat-square fs-2 opacity-50"></i>
              <p class="small mt-2">Aún no hay mensajes en este producto.</p>
            </div>

            <div *ngFor="let msg of mensajes" class="chat-bubble-row" [class.own]="esDelAdmin(msg)">
              <div class="chat-bubble" [class.admin-bubble]="esDelAdmin(msg)">
                <span class="chat-author">
                  {{ msg.remitenteNombre }}
                  <span *ngIf="msg.admin" class="badge bg-primary ms-1" style="font-size: 0.6rem;">Admin</span>
                </span>
                <span class="chat-text">{{ msg.contenido }}</span>
                <span class="chat-time">{{ msg.timestamp }}</span>
              </div>
            </div>
          </div>

          <!-- Input para responder -->
          <div class="chat-reply-area">
            <form (ngSubmit)="enviarRespuesta()" class="d-flex gap-2 w-100">
              <input
                type="text"
                class="chat-input flex-grow-1"
                placeholder="Responder como Admin..."
                [(ngModel)]="respuestaTexto"
                name="respuesta"
                autocomplete="off"
                [disabled]="!wsConectado">
              <button type="submit" class="chat-send-btn" [disabled]="!respuestaTexto.trim() || !wsConectado">
                <i class="bi bi-send-fill"></i>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .chat-inbox-container {
      display: flex;
      height: 520px;
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid var(--glass-border, rgba(255,255,255,0.1));
      background: var(--glass-bg, rgba(255,255,255,0.05));
    }

    /* Sidebar */
    .chat-sidebar {
      width: 240px;
      min-width: 200px;
      border-right: 1px solid var(--glass-border, rgba(255,255,255,0.1));
      display: flex;
      flex-direction: column;
    }
    .chat-sidebar-header {
      padding: 1rem;
      border-bottom: 1px solid var(--glass-border, rgba(255,255,255,0.1));
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .chat-product-list {
      flex: 1;
      overflow-y: auto;
    }
    .chat-product-item {
      padding: 0.75rem 1rem;
      cursor: pointer;
      transition: background 0.2s;
      border-bottom: 1px solid var(--glass-border, rgba(255,255,255,0.05));
    }
    .chat-product-item:hover,
    .chat-product-item.active {
      background: rgba(99, 102, 241, 0.15);
    }
    .chat-product-icon {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: rgba(99,102,241,0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #6366f1;
      flex-shrink: 0;
    }
    .chat-product-name {
      font-size: 0.85rem;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      color: var(--text-color, inherit);
    }

    /* Panel principal */
    .chat-main {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .chat-empty-state {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .chat-window {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    .chat-window-header {
      padding: 0.85rem 1.25rem;
      border-bottom: 1px solid var(--glass-border, rgba(255,255,255,0.1));
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .chat-status-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #9ca3af;
      transition: background 0.4s;
    }
    .chat-status-dot.connected { background: #10b981; box-shadow: 0 0 6px #10b981; }

    /* Messages */
    .chat-messages-area {
      flex: 1;
      overflow-y: auto;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .chat-empty-messages {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: var(--text-muted, #9ca3af);
    }
    .chat-bubble-row {
      display: flex;
      justify-content: flex-start;
    }
    .chat-bubble-row.own {
      justify-content: flex-end;
    }
    .chat-bubble {
      background: var(--glass-bg, rgba(255,255,255,0.08));
      border: 1px solid var(--glass-border, rgba(255,255,255,0.1));
      border-radius: 14px 14px 14px 4px;
      padding: 0.5rem 0.85rem;
      max-width: 80%;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .admin-bubble {
      background: rgba(99, 102, 241, 0.15);
      border-color: rgba(99, 102, 241, 0.3);
      border-radius: 14px 14px 4px 14px;
    }
    .chat-author {
      font-size: 0.72rem;
      font-weight: 700;
      color: #6366f1;
    }
    .chat-text {
      font-size: 0.88rem;
      color: var(--text-color, inherit);
      word-break: break-word;
    }
    .chat-time {
      font-size: 0.65rem;
      color: var(--text-muted, #9ca3af);
      align-self: flex-end;
    }

    /* Input */
    .chat-reply-area {
      padding: 0.75rem 1rem;
      border-top: 1px solid var(--glass-border, rgba(255,255,255,0.1));
      display: flex;
    }
    .chat-input {
      flex: 1;
      border: 1px solid var(--glass-border, rgba(255,255,255,0.15));
      background: var(--glass-bg, rgba(255,255,255,0.05));
      border-radius: 12px;
      padding: 0.5rem 1rem;
      font-size: 0.9rem;
      color: var(--text-color, inherit);
      outline: none;
      transition: border-color 0.2s;
    }
    .chat-input:focus { border-color: #6366f1; }
    .chat-send-btn {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: linear-gradient(135deg, #6366f1, #a855f7);
      border: none;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: opacity 0.2s, transform 0.1s;
      flex-shrink: 0;
    }
    .chat-send-btn:hover:not(:disabled) { opacity: 0.9; transform: scale(1.05); }
    .chat-send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  `]
})
export class AdminChatInbox implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private zone = inject(NgZone);

  productos: ProductoConChat[] = [];
  productoSeleccionado: ProductoConChat | null = null;
  mensajes: MensajeChat[] = [];
  respuestaTexto = '';
  cargandoProductos = false;
  cargandoMensajes = false;
  wsConectado = false;

  private stompClient: Client | null = null;
  private seenIds = new Set<string>();

  ngOnInit() {
    this.cargarProductos();
  }

  cargarProductos() {
    this.cargandoProductos = true;
    this.http.get<any[]>(`${environment.apiUrl}/admin/productos`).subscribe({
      next: (data) => {
        this.productos = (data || [])
          .filter(p => p.chatHabilitado)
          .map(p => ({
            id: p.id,
            nombre: p.nombre,
            slug: p.slug,
            chatHabilitado: p.chatHabilitado,
            tiendaId: p.tiendaId,
            unreadCount: 0
          }));
        this.cargandoProductos = false;
      },
      error: () => { this.cargandoProductos = false; }
    });
  }

  seleccionarProducto(producto: ProductoConChat) {
    if (this.productoSeleccionado?.id === producto.id) return;

    this.productoSeleccionado = producto;
    this.mensajes = [];
    this.seenIds.clear();
    producto.unreadCount = 0;

    this.cargarHistorial(producto.id);
    this.conectarWebSocket(producto.id);
  }

  cargarHistorial(productoId: number) {
    this.cargandoMensajes = true;
    this.http.get<MensajeChat[]>(`${environment.apiUrl}/chat/producto/${productoId}`).subscribe({
      next: (historial) => {
        this.mensajes = historial || [];
        this.mensajes.forEach(m => { if (m.id) this.seenIds.add(m.id); });
        this.cargandoMensajes = false;
        this.scrollBottom();
      },
      error: () => { this.cargandoMensajes = false; }
    });
  }

  conectarWebSocket(productoId: number) {
    // Desconectar sesión anterior
    this.stompClient?.deactivate();
    this.wsConectado = false;

    this.stompClient = new Client({
      webSocketFactory: () => new SockJS(environment.wsUrl),
      reconnectDelay: 5000,
    });

    this.stompClient.onConnect = () => {
      this.zone.run(() => { this.wsConectado = true; });

      // Suscribirse al canal exclusivo de chat
      this.stompClient?.subscribe(`/topic/chat/${productoId}`, (message: Message) => {
        if (!message.body) return;
        try {
          const nuevo: MensajeChat = JSON.parse(message.body);
          // Deduplicar
          if (nuevo.id && this.seenIds.has(nuevo.id)) return;
          if (nuevo.id) this.seenIds.add(nuevo.id);

          this.zone.run(() => {
            this.mensajes.push(nuevo);
            // Si es un producto diferente al seleccionado, marcar como no leído
            const prod = this.productos.find(p => p.id === nuevo.productoId);
            if (prod && this.productoSeleccionado?.id !== prod.id) {
              prod.unreadCount = (prod.unreadCount || 0) + 1;
            }
            this.scrollBottom();
          });
        } catch (e) { /* ignorar */ }
      });
    };

    this.stompClient.onWebSocketClose = () => {
      this.zone.run(() => { this.wsConectado = false; });
    };

    this.stompClient.activate();
  }

  enviarRespuesta() {
    if (!this.respuestaTexto.trim() || !this.productoSeleccionado || !this.stompClient?.connected) return;

    const user = this.authService.currentUser();
    const alias = user?.alias || user?.nombre || 'Admin';
    const email = user?.email || '';
    const hora = new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });

    const payload: MensajeChat = {
      contenido: this.respuestaTexto.trim(),
      remitenteNombre: alias,
      userEmail: email,
      productoId: this.productoSeleccionado.id,
      tiendaId: this.productoSeleccionado.tiendaId,
      timestamp: hora,
      admin: true,
      esVendedor: true
    };

    // Update optimista inmediato
    this.zone.run(() => {
      this.mensajes.push({ ...payload });
      this.scrollBottom();
    });

    this.stompClient.publish({
      destination: `/app/chat/${this.productoSeleccionado.id}`,
      body: JSON.stringify(payload)
    });

    this.respuestaTexto = '';
  }

  esDelAdmin(msg: MensajeChat): boolean {
    const user = this.authService.currentUser();
    return msg.userEmail === user?.email || msg.admin === true;
  }

  private scrollBottom() {
    setTimeout(() => {
      const el = document.getElementById('adminChatMessages');
      if (el) el.scrollTop = el.scrollHeight;
    }, 50);
  }

  ngOnDestroy() {
    this.stompClient?.deactivate();
  }
}
