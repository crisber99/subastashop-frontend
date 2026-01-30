import { Injectable, signal, computed } from '@angular/core';

export interface CartItem {
  producto: any;
  cantidad: number;
  tipo: 'DIRECTA' | 'SUBASTA' | 'RIFA';
  subtotal: number;
  extra?: any; // Para número de ticket
}

@Injectable({
  providedIn: 'root',
})
export class CartService {
  // Usamos SIGNALS de Angular (más moderno y reactivo)
  items = signal<CartItem[]>([]);

  // Totales calculados automáticamente
  total = computed(() => this.items().reduce((acc, item) => acc + item.subtotal, 0));
  cantidadItems = computed(() => this.items().length);

  agregarItem(producto: any, tipo: 'DIRECTA' | 'SUBASTA' | 'RIFA', cantidad: number = 1, extra: any = null) {
    const yaExiste = this.items().some(item => item.producto.id === producto.id);

    if (yaExiste) {
      alert('⚠️ Este producto es único y ya está en tu carrito.');
      return;
    }

    const precio = tipo === 'SUBASTA' ? producto.precioActual :
      tipo === 'RIFA' ? producto.precioTicket :
        producto.precioBase;

    const newItem: CartItem = {
      producto,
      cantidad,
      tipo,
      subtotal: precio * cantidad,
      extra
    };

    // Actualizamos la lista
    this.items.update(lista => [...lista, newItem]);

    // Feedback visual (opcional)
    alert('¡Producto agregado al carrito! 🛒');
  }

  eliminarItem(index: number) {
    this.items.update(lista => lista.filter((_, i) => i !== index));
  }

  eliminarItemPorId(productoId: number) {
    this.items.update(lista => lista.filter(item => item.producto.id !== productoId));
  }

  limpiarCarrito() {
    this.items.set([]);
  }

  estaEnCarrito(productoId: number): boolean {
    return this.items().some(item => item.producto.id === productoId);
  }
}