import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Client, Message } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { BehaviorSubject } from 'rxjs';

/**
 * MensajeChatDTO sincronizado con el Backend
 * contenido = mensaje
 * remitenteNombre = usuarioNombre
 * tiendaId = productoId (en este contexto de chat de tienda)
 */
export interface MensajeChatDTO {
  id?: string;
  contenido: string; 
  remitenteNombre: string;
  tiendaId: number;
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
  private stompClient: Client | null = null;
  private messageSubject = new BehaviorSubject<MensajeChatDTO[]>([]);

  public mensajes$ = this.messageSubject.asObservable();
  private currentTiendaId: number | null = null;
  private currentMessages: MensajeChatDTO[] = [];

  constructor() { }

  // 1. Obtener historial REST y conectar a WebSocket por TIENDA
  public initChat(tiendaId: number) {
    if (!tiendaId) {
      console.warn("⚠️ ChatService: No se puede iniciar chat sin tiendaId.");
      return;
    }
    
    this.currentTiendaId = tiendaId;
    this.currentMessages = [];
    this.messageSubject.next([]);

    console.log(`💬 ChatService: Iniciando chat para tienda ${tiendaId}...`);

    // Intentamos cargar historial (opcional, si el endpoint existe)
    this.http.get<MensajeChatDTO[]>(`${environment.apiUrl}/chat/tienda/${tiendaId}`).subscribe({
      next: (historial) => {
        this.currentMessages = historial || [];
        this.messageSubject.next([...this.currentMessages]);
      },
      error: (err) => console.warn("Historial de chat no disponible o error:", err.message)
    });

    // Conectar WebSocket
    this.conectarWebSocket(tiendaId);
  }

  private conectarWebSocket(tiendaId: number) {
    this.desconectar();

    const wsUrl = environment.wsUrl;
    console.log(`🔌 ChatService: Intentando conectar a ${wsUrl} (Tienda: ${tiendaId})`);

    this.stompClient = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      reconnectDelay: 5000,
      debug: (str) => {
        console.log('STOMP Debug (Chat):', str);
      }
    });

    this.stompClient.onConnect = (frame) => {
      console.log('✅ ChatService: Conectado existosamente!');
      
      // Suscribirse al canal de la tienda
      this.stompClient?.subscribe(`/topic/tienda/${tiendaId}`, (message: Message) => {
        if (message.body) {
          try {
            const mensajeNuevo: MensajeChatDTO = JSON.parse(message.body);
            console.log('📩 ChatService: Nuevo mensaje recibido!', mensajeNuevo);
            this.currentMessages.push(mensajeNuevo);
            this.messageSubject.next([...this.currentMessages]);
          } catch (e) {
            console.error("Error parseando mensaje de chat:", e);
          }
        }
      });
    };

    this.stompClient.onStompError = (frame) => {
      console.error('❌ ChatService Broker Error: ' + frame.headers['message']);
      console.error('Detalles:', frame.body);
    };

    this.stompClient.onWebSocketClose = () => {
       console.warn('⚠️ ChatService: Conexión WebSocket cerrada.');
    };

    this.stompClient.activate();
  }

  // 2. Enviar mensaje por WS
  public enviarMensaje(usuarioNombre: string, mensaje: string, email: string) {
    if (this.stompClient && this.stompClient.connected && this.currentTiendaId) {
      
      const payload: MensajeChatDTO = {
        contenido: mensaje,
        remitenteNombre: usuarioNombre,
        userEmail: email,
        tiendaId: Number(this.currentTiendaId)
      };
      
      console.log('📤 ChatService: Enviando mensaje...', payload);

      this.stompClient.publish({
        destination: `/app/chat/${this.currentTiendaId}`,
        body: JSON.stringify(payload)
      });
    } else {
      console.error("❌ ChatService: No se puede enviar mensaje. Estado:", {
        existeSTOMP: !!this.stompClient,
        conectado: this.stompClient?.connected,
        ID_Tienda: this.currentTiendaId
      });
    }
  }

  public desconectar() {
    if (this.stompClient) {
      console.log('🔌 ChatService: Desconectando...');
      this.stompClient.deactivate();
      this.stompClient = null;
    }
    this.currentTiendaId = null;
  }
}
