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
  _optimistic?: boolean; // flag interno, NO se envía al servidor
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private http = inject(HttpClient);
  private zone = inject(NgZone);
  private stompClient: Client | null = null;
  private messageSubject = new BehaviorSubject<MensajeChatDTO[]>([]);

  public mensajes$ = this.messageSubject.asObservable();
  private currentProductoId: number | null = null;
  private currentMessages: MensajeChatDTO[] = [];
  private seenIds = new Set<string>();

  // Claves de mensajes optimistas pendientes: "userEmail:contenido"
  private pendingOptimistic = new Set<string>();

  constructor() { }

  // ① Iniciar historial REST + conexión WebSocket
  public initChat(productoId: number) {
    if (!productoId) {
      console.warn('⚠️ ChatService: No se puede iniciar chat sin productoId.');
      return;
    }

    this.currentProductoId = productoId;
    this.currentMessages = [];
    this.seenIds.clear();
    this.pendingOptimistic.clear();
    this.messageSubject.next([]);

    // Cargar historial vía REST
    this.http.get<MensajeChatDTO[]>(`${environment.apiUrl}/chat/producto/${productoId}`).subscribe({
      next: (historial) => {
        console.log('📚 ChatService: Historial cargado:', historial?.length || 0, 'mensajes');
        this.currentMessages = historial || [];
        this.currentMessages.forEach(m => { if (m.id) this.seenIds.add(m.id); });
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
        if (!message.body) return;
        try {
          const nuevo: MensajeChatDTO = JSON.parse(message.body);
          console.log('📩 ChatService: Mensaje recibido por WS:', nuevo);

          // Deduplicar por ID de BD (evita recargar mensajes ya vistos)
          if (nuevo.id && this.seenIds.has(nuevo.id)) return;
          if (nuevo.id) this.seenIds.add(nuevo.id);

          // ¿Es el eco de un mensaje optimista propio?
          const key = `${nuevo.userEmail}:${nuevo.contenido}`;
          if (this.pendingOptimistic.has(key)) {
            this.pendingOptimistic.delete(key);

            // Reemplazar el optimista con la versión oficial del servidor (que trae ID real y timestamp oficial)
            const idx = this.currentMessages.findIndex(
              m => m._optimistic && m.userEmail === nuevo.userEmail && m.contenido === nuevo.contenido
            );
            if (idx >= 0) {
              this.zone.run(() => {
                this.currentMessages[idx] = nuevo; // versión oficial reemplaza optimista
                this.messageSubject.next([...this.currentMessages]);
              });
            }
            return; // no duplicar
          }

          // Mensaje nuevo de otro usuario — añadir normalmente
          this.zone.run(() => {
            this.currentMessages.push(nuevo);
            this.messageSubject.next([...this.currentMessages]);
          });
        } catch (e) {
          console.error('Error parseando mensaje de chat:', e);
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

  // ② Enviar mensaje con update optimista + deduplicación al recibir eco del servidor
  public enviarMensaje(usuarioNombre: string, mensaje: string, email: string, tiendaId?: number) {
    if (!this.stompClient?.connected || !this.currentProductoId) {
      console.error('❌ ChatService: No se puede enviar. Revisa la conexión.');
      return;
    }

    const hora = new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });

    const payload: MensajeChatDTO = {
      contenido: mensaje,
      remitenteNombre: usuarioNombre,
      userEmail: email,
      productoId: Number(this.currentProductoId),
      tiendaId: tiendaId,
      timestamp: hora
    };

    // Registrar clave pendiente para deduplicar el eco
    const key = `${email}:${mensaje}`;
    this.pendingOptimistic.add(key);

    // Mostrar el mensaje al remitente de inmediato (update optimista)
    this.zone.run(() => {
      this.currentMessages.push({ ...payload, _optimistic: true });
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
