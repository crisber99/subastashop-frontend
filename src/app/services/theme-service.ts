import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  isDarkMode = signal<boolean>(false);

  constructor() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      this.enableDarkMode();
    }
  }

  toggleTheme() {
    if (this.isDarkMode()) {
      this.disableDarkMode();
    } else {
      this.enableDarkMode();
    }
  }

  private enableDarkMode() {
    this.isDarkMode.set(true);
    document.body.classList.add('dark-theme');
    localStorage.setItem('theme', 'dark');
  }

  private disableDarkMode() {
    this.isDarkMode.set(false);
    document.body.classList.remove('dark-theme');
    localStorage.setItem('theme', 'light');
  }
}
