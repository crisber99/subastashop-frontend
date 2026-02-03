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
  public layoutService = inject(LayoutService);  

  esAdmin(): boolean {
    const rol = this.authService.currentUser()?.role;
    // Verifica que 'ROLE_ADMIN' esté escrito igual que en tu base de datos (mayúsculas)
    return rol === 'ROLE_ADMIN' || rol === 'ROLE_SUPER_ADMIN';
  }

  toggleSidebar() {
    this.layoutService.toggleSidebar();
  }

  logout() {
    this.authService.logout();
  }

  // 3. ¿Es Comprador/Vendedor normal? (No es ninguno de los anteriores)
  isComprador(): boolean {
    return !this.esAdmin;
  }
}