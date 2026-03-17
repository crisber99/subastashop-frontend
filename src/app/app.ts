import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth-service';
import { LayoutService } from './services/layout';
import { Loader } from './services/loader';
import { Navbar } from './components/navbar/navbar';
import { Sidebar } from './components/sidebar/sidebar';
import { FooterComponent } from './components/footer/footer';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule, Navbar, Sidebar, FooterComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  authService = inject(AuthService);
  layoutService = inject(LayoutService);
  router = inject(Router);
  loaderService = inject(Loader);

  isAuthPage(): boolean {
    const url = this.router.url;
    return url === '/login' || url === '/registro';
  }
}
