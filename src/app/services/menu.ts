import { Injectable, computed, inject } from '@angular/core';
import { AuthService } from './auth-service';

export interface MenuItem {
  label: string;
  icon: string;
  route: string;
  roles: string[];
  badge?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MenuService {
  private authService = inject(AuthService);

  private readonly ALL_ITEMS: MenuItem[] = [
    {
      label: 'Inicio',
      icon: 'bi-house-door',
      route: '/',
      roles: ['ROLE_USER', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_COMPRADOR']
    },
    {
      label: 'Mi Perfil',
      icon: 'bi-person-badge',
      route: '/mi-cuenta',
      roles: ['ROLE_USER', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_COMPRADOR']
    },
    {
      label: 'Panel Administración',
      icon: 'bi-speedometer2',
      route: '/admin',
      roles: ['ROLE_ADMIN']
    },
    {
      label: 'Config. de Tienda',
      icon: 'bi-gear',
      route: '/admin/configuracion',
      roles: ['ROLE_ADMIN']
    },
    /* {
      label: 'Analista de Datos IA',
      icon: 'bi-robot',
      route: '/admin/analisis-ia',
      roles: ['ROLE_ADMIN', 'ROLE_SUPER_ADMIN']
    }, */
    {
      label: 'Usuarios del Sistema',
      icon: 'bi-people',
      route: '/super-admin/usuarios',
      roles: ['ROLE_SUPER_ADMIN']
    },
    {
      label: 'Dashboard Global',
      icon: 'bi-grid-1x2-fill',
      route: '/super-admin',
      roles: ['ROLE_SUPER_ADMIN']
    },
    {
      label: 'Mis Compras',
      icon: 'bi-bag-check',
      route: '/dashboard',
      roles: ['ROLE_USER', 'ROLE_ADMIN', 'ROLE_COMPRADOR']
    },
    {
      label: 'Lista de Deseos',
      icon: 'bi-heart',
      route: '/mis-favoritos',
      roles: ['ROLE_USER', 'ROLE_ADMIN', 'ROLE_COMPRADOR', 'ROLE_SUPER_ADMIN']
    },
    {
      label: 'Ayuda / Soporte',
      icon: 'bi-question-circle',
      route: '/soporte',
      roles: ['ROLE_USER', 'ROLE_ADMIN', 'ROLE_COMPRADOR', 'ROLE_SUPER_ADMIN']
    },
    {
      label: 'Reportes y Denuncias',
      icon: 'bi-flag',
      route: '/super-admin/reportes',
      roles: ['ROLE_SUPER_ADMIN']
    }
  ];

  fullMenu = computed(() => {
    const user = this.authService.currentUser();
    if (!user) return [];

    const userRole = user.role || 'ROLE_USER';

    return this.ALL_ITEMS.filter(item => item.roles.includes(userRole));
  });

  // Items específicos para agrupaciones o secciones si fuera necesario
  adminItems = computed(() => {
    return this.fullMenu().filter(item => item.roles.includes('ROLE_ADMIN') || item.roles.includes('ROLE_SUPER_ADMIN'));
  });
}
