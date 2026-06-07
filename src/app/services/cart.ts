import { Injectable, signal, computed } from '@angular/core';
import Swal from 'sweetalert2';

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
  descuentoCupon = signal<{monto: number, codigo: string} | null>(null);

  // Totales calculados automáticamente
  subtotal = computed(() => this.items().reduce((acc, item) => acc + item.subtotal, 0));
  
  total = computed(() => {
    const sub = this.subtotal();
    const desc = this.descuentoCupon();
    if (desc) {
      return Math.max(0, sub - desc.monto);
    }
    return sub;
  });

  cantidadItems = computed(() => this.items().length);

  agregarItem(producto: any, tipo: 'DIRECTA' | 'SUBASTA' | 'RIFA', cantidad: number = 1, extra: any = null) {
    const yaExiste = this.items().some(item => item.producto.id === producto.id);
    
    if (yaExiste) {
      Swal.fire({
        icon: 'warning',
        title: 'Producto ya en el carrito',
        text: 'Este producto es único y ya está en tu carrito.',
        toast: true,
        position: 'top-end',
        timer: 3000,
        showConfirmButton: false
      });
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

    // Feedback visual
    Swal.fire({
      icon: 'success',
      title: '¡Agregado!',
      text: 'Producto agregado al carrito 🛒',
      toast: true,
      position: 'top-end',
      timer: 3000,
      showConfirmButton: false
    });
  }

  eliminarItem(index: number) {
    this.items.update(lista => lista.filter((_, i) => i !== index));
  }

  eliminarItemPorId(productoId: number) {
    this.items.update(lista => lista.filter(item => item.producto.id !== productoId));
  }

  limpiarCarrito() {
    this.items.set([]);
    this.descuentoCupon.set(null);
  }

  estaEnCarrito(productoId: number): boolean {
    return this.items().some(item => item.producto.id === productoId);
  }
}
