import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth-service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) { // Asumiendo que tienes un método que verifica el token
    return true;
  } else {
    // Si no está logueado, lo mandamos al login
    router.navigate(['/login']);
    return false;
  }
};