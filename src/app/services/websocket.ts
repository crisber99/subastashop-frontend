import { Injectable } from '@angular/core';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Websocket {
  private stompClient: Client | null = null;
  // Un Subject es como un Observable que podemos emitir manualmente
  private precioUpdates = new Subject<any>();

  constructor() { }

  conectar(onConnectedCallback?: () => void) {
    // Tu URL de Azure (¡NO LA CAMBIES!)
    const socket = new SockJS('https://api-subastashop-dhd5gec8hecxfbc9.centralus-01.azurewebsites.net/ws-subastas'); 
    
    this.stompClient = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
    });

    this.stompClient.onConnect = (frame) => {
      console.log('✅ Conectado a WebSocket de Azure!');
      
      // Si nos pasaron una función, la ejecutamos ahora que es seguro
      if (onConnectedCallback) {
        onConnectedCallback();
      }
    };

    this.stompClient.onStompError = (frame) => {
      console.error('❌ Error en Broker: ' + frame.headers['message']);
    };

    this.stompClient.activate();
  }

  suscribirseProducto(productoId: number) {
    // Doble chequeo de seguridad
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

  obtenerActualizaciones() {
    return this.precioUpdates.asObservable();
  }
  
  desconectar() {
    if (this.stompClient) {
      this.stompClient.deactivate();
    }
  }
}