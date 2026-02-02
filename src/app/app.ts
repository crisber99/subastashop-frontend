import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth-service';
import { Loader } from './services/loader';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, RouterModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  authService = inject(AuthService);
  router = inject(Router);
  loaderService = inject(Loader);

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
