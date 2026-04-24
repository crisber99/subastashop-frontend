import { Injectable } from '@angular/core';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Subject, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class Websocket {
  private stompClient: Client | null = null;
  // Un Subject es como un Observable que podemos emitir manualmente
  private precioUpdates = new Subject<any>();
  private globalUpdates = new Subject<any>();
  private connectedStatus = new BehaviorSubject<boolean>(false);

  constructor() { }

  conectar(onConnectedCallback?: () => void) {
    // Tu URL de Azure (¡NO LA CAMBIES!)
    const socket = new SockJS(environment.wsUrl); 
    
    this.stompClient = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
    });

    this.stompClient.onConnect = (frame) => {
      console.log('✅ Conectado a WebSocket de Azure!');
      this.connectedStatus.next(true); // Actualizamos estado a Conectado
      
      // Si nos pasaron una función, la ejecutamos ahora que es seguro
      if (onConnectedCallback) {
        onConnectedCallback();
      }
    };

    this.stompClient.onWebSocketClose = () => {
      this.connectedStatus.next(false); // Reflejamos desconexión o pérdida de señal
    };

    this.stompClient.onStompError = (frame) => {
      console.error('❌ Error en Broker: ' + frame.headers['message']);
      this.connectedStatus.next(false);
    };

    this.stompClient.activate();
  }

  suscribirseRifa(productoId: number) {
    if (this.stompClient && this.stompClient.connected) {
      console.log(`📡 Suscribiéndose al canal de sorteo: /topic/rifa/${productoId}`);
      
      return this.stompClient.subscribe(`/topic/rifa/${productoId}`, (mensaje) => {
        console.log('📩 ¡Mensaje de sorteo recibido!', mensaje.body);
        this.precioUpdates.next(JSON.parse(mensaje.body));
      });
    } else {
      console.warn('⚠️ Intentando suscribir a rifa sin conexión activa');
      return null;
    }
  }

  suscribirsePodio(productoId: number) {
    if (this.stompClient && this.stompClient.connected) {
      console.log(`📡 Suscribiéndose al podio: /topic/concurso/${productoId}/podio`);
      
      return this.stompClient.subscribe(`/topic/concurso/${productoId}/podio`, (mensaje) => {
        console.log('📩 ¡Mensaje de podio recibido!', mensaje.body);
        const data = JSON.parse(mensaje.body);
        this.precioUpdates.next({ tipo: 'PODIO_ACTUALIZADO', podio: data });
      });
    } else {
      console.warn('⚠️ Intentando suscribir a podio sin conexión activa');
      return null;
    }
  }

  suscribirseProducto(productoId: number) {
    if (this.stompClient && this.stompClient.connected) {
      console.log(`📡 Suscribiéndose al canal: /topic/producto/${productoId}`);
      
      return this.stompClient.subscribe(`/topic/producto/${productoId}`, (mensaje) => {
        console.log('📩 ¡Mensaje recibido!', mensaje.body);
        this.precioUpdates.next(JSON.parse(mensaje.body));
      });
    } else {
      console.warn('⚠️ Intentando suscribir sin conexión activa');
      return null;
    }
  }

  suscribirseGlobal(usuarioId: number) {
    if (this.stompClient && this.stompClient.connected) {
      console.log(`📡 Suscribiéndose a canal global de usuario: /topic/usuario/${usuarioId}`);
      
      // Asegurarse de no tener múltiples suscripciones al mismo canal si se llama más de una vez
      return this.stompClient.subscribe(`/topic/usuario/${usuarioId}`, (mensaje) => {
        console.log('📩 ¡Mensaje global recibido!', mensaje.body);
        this.globalUpdates.next(JSON.parse(mensaje.body));
      });
    } else {
      console.warn('⚠️ Intentando suscribir global sin conexión activa');
      return null;
    }
  }

  obtenerActualizaciones() {
    return this.precioUpdates.asObservable();
  }

  getGlobalUpdates() {
    return this.globalUpdates.asObservable();
  }

  getConnectionStatus() {
    return this.connectedStatus.asObservable();
  }
  
  desconectar() {
    if (this.stompClient) {
      this.stompClient.deactivate();
      this.connectedStatus.next(false);
    }
  }
}
