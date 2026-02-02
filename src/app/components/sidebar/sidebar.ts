import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth-service';
import { LayoutService } from '../../services/layout';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  authService = inject(AuthService);
  layoutService = inject(LayoutService);

  // 1. ¿Es Súper Admin? (Ve TODO)
  get isSuperAdmin(): boolean {
    return this.authService.currentUser()?.role === 'ROLE_SUPER_ADMIN';
  }

  // 2. ¿Es Admin de Tienda? (Ve Configuración y Tienda)
  get isAdmin(): boolean {
    return this.authService.currentUser()?.role === 'ROLE_ADMIN';
  }

  // 3. ¿Es Comprador/Vendedor normal? (No es ninguno de los anteriores)
  get isComprador(): boolean {
    return !this.isSuperAdmin && !this.isAdmin;
  }
}