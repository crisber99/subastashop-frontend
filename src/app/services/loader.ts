import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class Loader {
  // Usamos 'Signals' de Angular 17+ (¡Lo más moderno!)
  isLoading = signal(false);

  show() {
    this.isLoading.set(true);
  }

  hide() {
    this.isLoading.set(false);
  }
}