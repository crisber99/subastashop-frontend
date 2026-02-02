import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LogoutButton } from '../logout-button/logout-button';
import { AuthService } from '../../services/auth-service';
import { LayoutService } from '../../services/layout';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  // 👇 AQUÍ ESTÁ LA CLAVE: Agrega todo lo que usas en el HTML
  imports: [
    CommonModule,
    RouterModule
  ],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  authService = inject(AuthService);
  layoutService = inject(LayoutService);
}
