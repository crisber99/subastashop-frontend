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
      roles: ['ROLE_USER', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN']
    },
    {
      label: 'Mi Perfil',
      icon: 'bi-person-badge',
      route: '/mi-cuenta',
      roles: ['ROLE_USER']
    },
    {
      label: 'Panel Administración',
      icon: 'bi-speedometer2',
      route: '/admin',
      roles: ['ROLE_ADMIN', 'ROLE_SUPER_ADMIN']
    },
    {
      label: 'Config. Transacciones',
      icon: 'bi-gear',
      route: '/admin/configuracion',
      roles: ['ROLE_ADMIN']
    },
    {
      label: 'Usuarios del Sistema',
      icon: 'bi-people',
      route: '/super-admin/usuarios',
      roles: ['ROLE_SUPER_ADMIN']
    },
    {
        label: 'Gestión de Tiendas',
        icon: 'bi-shop',
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
        label: 'Reportes y Denuncias',
        icon: 'bi-flag',
        route: '/super-admin/reportes',
        roles: ['ROLE_SUPER_ADMIN']
    }
  ];

  fullMenu = computed(() => {
    const user = this.authService.currentUser();
    if (!user) return [];

    const userRole = user.rol || user.role || 'ROLE_USER';

    return this.ALL_ITEMS.filter(item => item.roles.includes(userRole));
  });

  // Items específicos para agrupaciones o secciones si fuera necesario
  adminItems = computed(() => {
    return this.fullMenu().filter(item => item.roles.includes('ROLE_ADMIN') || item.roles.includes('ROLE_SUPER_ADMIN'));
  });
}
