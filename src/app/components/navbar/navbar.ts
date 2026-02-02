import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router'; // Importante para routerLink
import { AuthService } from '../../services/auth-service';
import { LayoutService } from '../../services/layout';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {
  authService = inject(AuthService); // Inyectamos el servicio
  layoutService = inject(LayoutService);  

  toggleSidebar() {
    this.layoutService.toggleSidebar();
  }
  
  logout() {
    this.authService.logout();
  }
}