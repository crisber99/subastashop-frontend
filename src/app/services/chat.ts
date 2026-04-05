import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Client, Message } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { BehaviorSubject, Observable } from 'rxjs';

export interface MensajeChatDTO {
  usuarioEmail?: string;
  usuarioNombre: string;
  productoId: number;
  mensaje: string;
  fechaEnvio?: string;
  esVendedor: boolean;
  admin: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private http = inject(HttpClient);
  private stompClient: Client | null = null;
  private messageSubject = new BehaviorSubject<MensajeChatDTO[]>([]);

  public mensajes$ = this.messageSubject.asObservable();
  private currentProductoId: number | null = null;
  private currentMessages: MensajeChatDTO[] = [];

  constructor() { }

  // 1. Obtener historial REST y conectar a WebSocket
  public initChat(productoId: number) {
    this.currentProductoId = productoId;
    this.currentMessages = [];
    this.messageSubject.next([]);

    // Cargar historial
    this.http.get<MensajeChatDTO[]>(`${environment.apiUrl}/chat/producto/${productoId}`).subscribe({
      next: (historial) => {
        this.currentMessages = historial;
        this.messageSubject.next([...this.currentMessages]);
      },
      error: (err) => console.error("Error cargando historial de chat:", err)
    });

    // Conectar WebSocket
    this.conectarWebSocket(productoId);
  }

  private conectarWebSocket(productoId: number) {
    // Si ya existe una conexion activa, desconectarla primero
    this.desconectar();

    // Usar la URL de WebSocket definida en el environment para evitar errores de DNS
    const wsUrl = environment.wsUrl;

    this.stompClient = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      reconnectDelay: 5000,
      debug: (str) => {
        // console.log(str); // Comenta o descomenta para depuración
      }
    });

    this.stompClient.onConnect = (frame) => {
      // Suscribirse al canal específico del producto
      this.stompClient?.subscribe(`/topic/chat/${productoId}`, (message: Message) => {
        if (message.body) {
          const mensajeNuevo: MensajeChatDTO = JSON.parse(message.body);
          this.currentMessages.push(mensajeNuevo);
          this.messageSubject.next([...this.currentMessages]);
        }
      });
    };

    this.stompClient.onStompError = (frame) => {
      console.error('Broker error: ' + frame.headers['message']);
      console.error('Additional details: ' + frame.body);
    };

    this.stompClient.activate();
  }

  // 2. Enviar mensaje por WS
  public enviarMensaje(usuarioEmail: string, mensaje: string) {
    if (this.stompClient && this.stompClient.connected && this.currentProductoId) {
      const payload = {
        usuarioEmail: usuarioEmail,
        productoId: this.currentProductoId,
        mensaje: mensaje
      };
      
      this.stompClient.publish({
        destination: `/app/chat/${this.currentProductoId}`,
        body: JSON.stringify(payload)
      });
    } else {
      console.error("STOMP no está conectado o producto no definido.");
    }
  }

  // 3. Limpiar al destruir componente
  public desconectar() {
    if (this.stompClient) {
      if (this.stompClient.connected) {
         this.stompClient.deactivate();
      }
      this.stompClient = null;
    }
    this.currentProductoId = null;
  }
}
