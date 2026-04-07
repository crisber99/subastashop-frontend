import { Injectable, inject, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Client, Message } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { BehaviorSubject } from 'rxjs';

/**
 * MensajeChatDTO sincronizado con el Backend
 */
export interface MensajeChatDTO {
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

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private http = inject(HttpClient);
  private zone = inject(NgZone);   // ← FIX: para forzar change detection
  private stompClient: Client | null = null;
  private messageSubject = new BehaviorSubject<MensajeChatDTO[]>([]);

  public mensajes$ = this.messageSubject.asObservable();
  private currentProductoId: number | null = null;
  private currentMessages: MensajeChatDTO[] = [];
  private seenIds = new Set<string>(); // evitar duplicados

  constructor() { }

  // 1. Iniciar historial REST + WebSocket
  public initChat(productoId: number) {
    if (!productoId) {
      console.warn('⚠️ ChatService: No se puede iniciar chat sin productoId.');
      return;
    }
    
    this.currentProductoId = productoId;
    this.currentMessages = [];
    this.seenIds.clear();
    this.messageSubject.next([]);

    // Cargar historial vía REST
    this.http.get<MensajeChatDTO[]>(`${environment.apiUrl}/chat/producto/${productoId}`).subscribe({
      next: (historial) => {
        console.log('📚 ChatService: Historial cargado:', historial?.length || 0, 'mensajes');
        this.currentMessages = historial || [];
        this.currentMessages.forEach(m => { if (m.id) this.seenIds.add(m.id); });
        // FIX: zone.run para que Angular detecte el cambio
        this.zone.run(() => this.messageSubject.next([...this.currentMessages]));
      },
      error: (err) => console.warn('Historial de chat no disponible:', err.message)
    });

    this.conectarWebSocket(productoId);
  }

  private conectarWebSocket(productoId: number) {
    this.desconectar();

    const wsUrl = environment.wsUrl;
    console.log(`🔌 ChatService: Conectando a ${wsUrl} (Producto: ${productoId})`);

    this.stompClient = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      reconnectDelay: 5000,
      debug: (str) => console.log('STOMP Debug (Chat):', str)
    });

    this.stompClient.onConnect = () => {
      console.log('✅ ChatService: Conectado exitosamente!');

      this.stompClient?.subscribe(`/topic/producto/${productoId}`, (message: Message) => {
        if (message.body) {
          try {
            const nuevo: MensajeChatDTO = JSON.parse(message.body);
            console.log('📩 ChatService: Mensaje recibido por WS:', nuevo);

            // Evitar duplicados (el sender ya lo añadió optimistamente)
            if (nuevo.id && this.seenIds.has(nuevo.id)) return;
            if (nuevo.id) this.seenIds.add(nuevo.id);

            // FIX CRÍTICO: NgZone.run fuerza el change detection de Angular
            this.zone.run(() => {
              this.currentMessages.push(nuevo);
              this.messageSubject.next([...this.currentMessages]);
            });
          } catch (e) {
            console.error('Error parseando mensaje de chat:', e);
          }
        }
      });
    };

    this.stompClient.onStompError = (frame) => {
      console.error('❌ ChatService Broker Error:', frame.headers['message']);
    };

    this.stompClient.onWebSocketClose = () => {
      console.warn('⚠️ ChatService: Conexión WebSocket cerrada.');
    };

    this.stompClient.activate();
  }

  // 2. Enviar mensaje (con update optimista instantáneo)
  public enviarMensaje(usuarioNombre: string, mensaje: string, email: string, tiendaId?: number) {
    if (!this.stompClient?.connected || !this.currentProductoId) {
      console.error('❌ ChatService: No se puede enviar. Revisa la conexión.');
      return;
    }

    const payload: MensajeChatDTO = {
      contenido: mensaje,
      remitenteNombre: usuarioNombre,
      userEmail: email,
      productoId: Number(this.currentProductoId),
      tiendaId: tiendaId,
      timestamp: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
    };

    // Update optimista: mostrar el mensaje al remitente de inmediato
    this.zone.run(() => {
      this.currentMessages.push(payload);
      this.messageSubject.next([...this.currentMessages]);
    });

    console.log('📤 ChatService: Enviando mensaje...', payload);

    this.stompClient.publish({
      destination: `/app/chat/${this.currentProductoId}`,
      body: JSON.stringify(payload)
    });
  }

  public desconectar() {
    if (this.stompClient) {
      console.log('🔌 ChatService: Desconectando...');
      this.stompClient.deactivate();
      this.stompClient = null;
    }
  }
}
