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

  ngOnInit() {
    this.cargarDatos();
    this.cargarOpcionesEnvio();
  }

  cargarDatos() {
    const user = this.authService.currentUser();
    if (user) {
      this.profileData = {
        nombre: user.nombreCompleto || '',
        alias: user.alias || '',
        telefono: user.telefono || '',
        direccion: user.direccion || '',
        preferenciaEnvio: user.preferenciaEnvio || ''
      };
    }
  }

  cargarOpcionesEnvio() {
    this.productService.getStoreConfig().subscribe({
      next: (config) => {
        if (config && config.opcionesEnvio) {
          this.shippingOptions = config.opcionesEnvio.split(',')
            .map((s: string) => s.trim())
            .filter((s: string) => s.length > 0);
        } else {
          this.shippingOptions = ['Despacho a Domicilio', 'Retiro en Tienda', 'Envío por Pagar'];
        }
      },
      error: () => this.shippingOptions = ['Envío Estándar']
    });
  }

  async updateProfile() {
    this.loading = true;
    this.authService.updateProfile(this.profileData).subscribe({
      next: () => {
        this.loading = false;
        Swal.fire('¡Éxito!', 'Tus datos han sido actualizados.', 'success');
        this.authService.refreshSession().subscribe();
      },
      error: (err) => {
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
      error: (err) => {
        this.loading = false;
        Swal.fire('Error', err.error?.error || 'La contraseña actual es incorrecta.', 'error');
      }
    });
  }
}
