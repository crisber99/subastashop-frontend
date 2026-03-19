import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router'; 
import { AuthService } from '../../services/auth-service';
import { LayoutService } from '../../services/layout';
import { CartService } from '../../services/cart';
import { ThemeService } from '../../services/theme-service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {
  authService = inject(AuthService);
  layoutService = inject(LayoutService);
  cartService = inject(CartService);
  themeService = inject(ThemeService);

  dropdownOpen = signal(false);

  toggleSidebar() {
    this.layoutService.toggleSidebar();
  }

  toggleDropdown(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.dropdownOpen.update(v => !v);
  }

  logout() {
    this.authService.logout();
  }
}