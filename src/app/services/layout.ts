import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LayoutService {
  // Usamos 'signals' (la forma moderna de Angular)
  sidebarOpen = signal(false); // Empieza cerrado en móviles por defecto

  toggleSidebar() {
    this.sidebarOpen.update(value => !value);
  }
}