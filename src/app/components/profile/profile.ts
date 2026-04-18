import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth-service';
import { ProductService } from '../../services/product';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.scss'
})
export class ProfileComponent implements OnInit {
  authService = inject(AuthService);
  private productService = inject(ProductService);

  activeTab: 'data' | 'security' = 'data';

  // Datos Personales
  profileData = {
    nombre: '',
    alias: '',
    telefono: '',
    direccion: '',
    rut: '',
    preferenciaEnvio: ''
  };

  // Seguridad
  passwords = {
    current: '',
    new: '',
    confirm: ''
  };

  shippingOptions: string[] = [];
  loading = false;
  rutAlreadyExists = false; // 👈 NUEVO

  ngOnInit() {
    this.shippingOptions = ['Bluexpress', 'Paket', 'Starken'];
    this.cargarDatos();
  }

  cargarDatos() {
    const user = this.authService.currentUser();
    console.log("Cargando datos de perfil del usuario:", user);
    if (user) {
      this.rutAlreadyExists = !!user.rut && user.rut.trim().length > 0; // 👈 Detectar si ya hay RUT
      this.profileData = {
        nombre: user.nombre || user.nombreCompleto || '',
        alias: user.alias || '',
        telefono: user.telefono || '',
        direccion: user.direccion || '',
        rut: user.rut || '',
        preferenciaEnvio: user.preferenciaEnvio || ''
      };
    }
  }

  formatRut(rut: string): string {
    if (!rut) return 'No registrado';
    let value = rut.replace(/\./g, '').replace('-', '');
    if (value.length < 2) return value;

    let cuerpo = value.slice(0, -1);
    let dv = value.slice(-1).toUpperCase();

    // Formatear cuerpo con puntos
    let result = '';
    while (cuerpo.length > 3) {
      result = '.' + cuerpo.slice(-3) + result;
      cuerpo = cuerpo.slice(0, -3);
    }
    result = cuerpo + result;

    return result + '-' + dv;
  }



  async updateProfile() {
    this.loading = true;
    this.authService.updateProfile(this.profileData).subscribe({
      next: () => {
        this.loading = false;
        Swal.fire('¡Éxito!', 'Tus datos han sido actualizados.', 'success');
        this.authService.refreshSession().subscribe();
      },
      error: (err: any) => {
        this.loading = false;
        Swal.fire('Error', err.error?.message || 'No se pudo actualizar el perfil.', 'error');
      }
    });
  }

  updatePassword() {
    if (this.passwords.new !== this.passwords.confirm) {
      Swal.fire('Error', 'Las contraseñas no coinciden.', 'error');
      return;
    }

    if (this.passwords.new.length < 6) {
      Swal.fire('Error', 'La nueva contraseña debe tener al menos 6 caracteres.', 'error');
      return;
    }

    this.loading = true;
    this.authService.changePassword({
      currentPassword: this.passwords.current,
      newPassword: this.passwords.new
    }).subscribe({
      next: () => {
        this.loading = false;
        this.passwords = { current: '', new: '', confirm: '' };
        Swal.fire('Contraseña Cambiada', 'Tu seguridad ha sido actualizada.', 'success');
      },
      error: (err: any) => {
        this.loading = false;
        Swal.fire('Error', err.error?.error || 'La contraseña actual es incorrecta.', 'error');
      }
    });
  }
}
