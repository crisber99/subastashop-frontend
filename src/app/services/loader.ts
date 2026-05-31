import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class Loader {
  private requestCount = 0;
  isLoading = signal(false);

  show() {
    this.requestCount++;
    if (this.requestCount > 0) {
      this.isLoading.set(true);
    }
  }

  hide() {
    this.requestCount--;
    if (this.requestCount <= 0) {
      this.requestCount = 0;
      this.isLoading.set(false);
    }
  }
}
