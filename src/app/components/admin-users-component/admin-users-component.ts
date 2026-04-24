import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SuperAdminService } from '../../services/super-admin';
import Swal from 'sweetalert2'; // 👈 Importamos SweetAlert

@Component({
  selector: 'app-admin-users-component',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-users-component.html',
  styleUrl: './admin-users-component.scss',
})
export class AdminUsersComponent implements OnInit {

  // Inyectamos el servicio que creamos antes
  private adminService = inject(SuperAdminService);

  // Variables de estado
  usuarios: any[] = [];
  usuariosFiltrados: any[] = [];
  filtro: string = '';
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
        this.usuariosFiltrados = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando usuarios:', err);
        this.error = 'No se pudieron cargar los usuarios. Verifica tu conexión o permisos.';
        this.loading = false;
        
        // Alerta de error al cargar
        Swal.fire({
          icon: 'error',
          title: 'Error de conexión',
          text: 'No se pudieron cargar los usuarios. Intenta recargar la página.',
          confirmButtonText: 'Entendido'
        });
      }
    });
  }

  /**
   * Cambia el rol de un usuario (Ej: de Comprador a Vendedor)
   */
  cambiarRol(user: any, nuevoRol: string) {
    // 1. Evitar acciones redundantes
    if (user.rol === nuevoRol) return;

    // 2. Confirmación de seguridad con SweetAlert
    Swal.fire({
      title: '¿Cambiar Rol?',
      text: `¿Estás seguro de cambiar a ${user.nombreCompleto || user.email} al rol de ${nuevoRol}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, cambiar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      
      if (result.isConfirmed) {
        // 3. Llamada al servicio
        this.adminService.cambiarRol(user.id, nuevoRol).subscribe({
          next: (response) => {
            // Actualizamos la vista localmente
            user.rol = nuevoRol;
            
            // Alerta de Éxito
            Swal.fire({
              icon: 'success',
              title: '¡Rol Actualizado!',
              text: `El usuario ahora es ${nuevoRol}`,
              timer: 2000, // Se cierra solo a los 2 segundos
              showConfirmButton: false
            });
          },
          error: (err) => {
            console.error(err);
            // Alerta de Error
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo cambiar el rol. Revisa la consola o intenta más tarde.'
            });
          }
        });
      }
    });
  }

  /**
   * Elimina un usuario permanentemente
   */
  eliminarUsuario(user: any) {
    // Seguridad: No permitir borrar al Super Admin
    if (user.rol === 'ROLE_SUPER_ADMIN') {
      Swal.fire({
        icon: 'error',
        title: 'Acción Prohibida',
        text: '⛔ No puedes eliminar al Super Admin principal.'
      });
      return;
    }

    // Confirmación crítica con SweetAlert
    Swal.fire({
      title: '¿Estás seguro?',
      text: `Vas a eliminar a ${user.nombreCompleto || user.email}. Esta acción NO se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33', // Rojo para peligro
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar usuario',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      
      if (result.isConfirmed) {
        // Llamada al servicio
        this.adminService.eliminarUsuario(user.id).subscribe({
          next: () => {
            // Filtramos la lista para quitar al usuario eliminado
            this.usuarios = this.usuarios.filter(u => u.id !== user.id);
            
            Swal.fire(
              '¡Eliminado!',
              'El usuario ha sido eliminado correctamente.',
              'success'
            );
          },
          error: (err) => {
            console.error(err);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Ocurrió un problema al intentar eliminar el usuario.'
            });
          }
        });
      }
    });
  }

  filtrar() {
    const query = this.filtro.toLowerCase().trim();
    if (!query) {
      this.usuariosFiltrados = this.usuarios;
      return;
    }
    this.usuariosFiltrados = this.usuarios.filter(u => 
      (u.nombreCompleto && u.nombreCompleto.toLowerCase().includes(query)) ||
      (u.email && u.email.toLowerCase().includes(query)) ||
      (u.rol && u.rol.toLowerCase().includes(query))
    );
  }

  editarUsuario(user: any) {
    Swal.fire({
      title: 'Editar Usuario',
      html: `
        <div class="swal-custom-container text-start">
          <label class="form-label mb-1 fw-bold small">Nombre Completo</label>
          <input id="swal-input1" class="form-control mb-3" value="${user.nombreCompleto || ''}" placeholder="Ej: Juan Pérez">
          
          <label class="form-label mb-1 fw-bold small">Teléfono</label>
          <input id="swal-input2" class="form-control mb-3" value="${user.telefono || ''}" placeholder="+56 9 ...">
          
          <label class="form-label mb-1 fw-bold small">Dirección</label>
          <input id="swal-input3" class="form-control mb-3" value="${user.direccion || ''}" placeholder="Calle 123...">
          
          <label class="form-label mb-1 fw-bold small">Alias (Nombre Público)</label>
          <input id="swal-input-alias" class="form-control mb-3" value="${user.alias || ''}" placeholder="Ej: @juan_pro">
          
          <label class="form-label mb-1 fw-bold small">Email</label>
          <input id="swal-input4" class="form-control mb-1" value="${user.email || ''}" placeholder="correo@ejemplo.com">
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Guardar Cambios',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        return {
          nombreCompleto: (document.getElementById('swal-input1') as HTMLInputElement).value,
          telefono: (document.getElementById('swal-input2') as HTMLInputElement).value,
          direccion: (document.getElementById('swal-input3') as HTMLInputElement).value,
          alias: (document.getElementById('swal-input-alias') as HTMLInputElement).value,
          email: (document.getElementById('swal-input4') as HTMLInputElement).value
        }
      }
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({ title: 'Procesando...', didOpen: () => Swal.showLoading() });
        this.adminService.actualizarUsuario(user.id, result.value).subscribe({
          next: () => {
            // Actualización exitosa: refrescamos los datos del objeto local
            Object.assign(user, result.value);
            this.filtrar(); // Re-aplicar filtro si existe
            Swal.fire('¡Actualizado!', 'Los datos del usuario han sido guardados.', 'success');
          },
          error: (err) => {
            console.error(err);
            Swal.fire('Error', 'No se pudieron guardar los cambios.', 'error');
          }
        });
      }
    });
  }

  regalarSuscripcion(user: any) {
    Swal.fire({
      title: '🎁 ¿Regalar Suscripción PRO?',
      text: `Estás a punto de activar la suscripción PRO para ${user.nombreCompleto || user.email} de forma gratuita.`,
      icon: 'info',
      showCancelButton: true,
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, ¡regalar PRO!',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({ title: 'Activando...', didOpen: () => Swal.showLoading() });
        
        this.adminService.regalarSuscripcion(user.id).subscribe({
          next: () => {
            user.rol = 'ROLE_ADMIN';
            user.suscripcionActiva = true;
            Swal.fire('¡Regalo Enviado!', 'El usuario ahora es PRO y Administrador.', 'success');
          },
          error: (err) => {
            console.error(err);
            Swal.fire('Error', 'No se pudo activar la suscripción.', 'error');
          }
        });
      }
    });
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
