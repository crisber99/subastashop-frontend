import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SuperAdminService } from '../../services/super-admin';

@Component({
  selector: 'app-admin-users-component',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-users-component.html',
  styleUrl: './admin-users-component.scss',
})
export class AdminUsersComponent implements OnInit {
  
  // Inyectamos el servicio que creamos antes
  private adminService = inject(SuperAdminService);
  
  // Variables de estado
  usuarios: any[] = [];
  loading: boolean = true;
  error: string | null = null;

  ngOnInit() {
    this.cargarUsuarios();
  }

  /**
   * Carga la lista completa de usuarios desde el Backend
   */
  cargarUsuarios() {
    this.loading = true;
    this.error = null;

    this.adminService.getUsuarios().subscribe({
      next: (data) => {
        this.usuarios = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando usuarios:', err);
        this.error = 'No se pudieron cargar los usuarios. Verifica tu conexión o permisos.';
        this.loading = false;
      }
    });
  }

  /**
   * Cambia el rol de un usuario (Ej: de Comprador a Vendedor)
   */
  cambiarRol(user: any, nuevoRol: string) {
    // 1. Evitar acciones redundantes
    if (user.rol === nuevoRol) return;

    // 2. Confirmación de seguridad
    const confirmacion = confirm(`¿Estás seguro de cambiar a ${user.nombreCompleto || user.email} al rol de ${nuevoRol}?`);
    if (!confirmacion) return;

    // 3. Llamada al servicio
    this.adminService.cambiarRol(user.id, nuevoRol).subscribe({
      next: (response) => {
        // Actualizamos la vista localmente para que se vea rápido
        user.rol = nuevoRol;
        alert(`✅ Rol actualizado correctamente a ${nuevoRol}`);
      },
      error: (err) => {
        console.error(err);
        alert('❌ Error al cambiar el rol. Revisa la consola.');
      }
    });
  }

  /**
   * Elimina un usuario permanentemente
   */
  eliminarUsuario(user: any) {
    // Seguridad: No permitir borrar al Super Admin (aunque el backend lo proteja)
    if (user.rol === 'ROLE_SUPER_ADMIN') {
      alert('⛔ No puedes eliminar al Super Admin.');
      return;
    }

    const confirmacion = confirm(`⚠️ ¡CUIDADO! \n\nEstás a punto de eliminar a: ${user.nombreCompleto}\nEsta acción NO se puede deshacer.\n\n¿Continuar?`);
    
    if (confirmacion) {
      this.adminService.eliminarUsuario(user.id).subscribe({
        next: () => {
          // Filtramos la lista para quitar al usuario eliminado
          this.usuarios = this.usuarios.filter(u => u.id !== user.id);
          alert('🗑️ Usuario eliminado con éxito.');
        },
        error: (err) => {
          console.error(err);
          alert('❌ Error al eliminar el usuario.');
        }
      });
    }
  }

  /**
   * Helper para obtener el color del badge según el rol
   */
  getBadgeClass(rol: string): string {
    switch (rol) {
      case 'ROLE_SUPER_ADMIN': return 'bg-dark';
      case 'ROLE_ADMIN': return 'bg-danger';
      case 'ROLE_VENDEDOR': return 'bg-success';
      case 'ROLE_COMPRADOR': return 'bg-primary';
      default: return 'bg-secondary';
    }
  }
}