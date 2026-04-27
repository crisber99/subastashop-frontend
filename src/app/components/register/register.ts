import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth-service';
import { passwordValidator, noPersonalDataValidator } from '../../validators/pswd-validator';
import { LegalTermsComponent } from '../legal-terms/legal-terms';
import { ProductService } from '../../services/product';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, LegalTermsComponent],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register implements OnInit {
  private fb = inject(FormBuilder);
  authService = inject(AuthService);
  router = inject(Router);
  private productService = inject(ProductService);

  registerForm!: FormGroup;
  mensajeError = '';
  cargando = false;
  shippingOptions: string[] = []; // 👈 NUEVO: Lista de opciones de envío

  ngOnInit() {
    this.shippingOptions = ['Bluexpress', 'Paket', 'Starken'];

    this.registerForm = this.fb.group({
      nombre: ['', [Validators.required]],
      alias: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(20)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, passwordValidator()]],
      telefono: [''],
      direccion: [''],
      rut: ['', [Validators.required]],
      opcionEnvio: ['', [Validators.required]], // 👈 NUEVO: Selección obligatoria
      aceptaTerminos: [false, [Validators.requiredTrue]]
    }, {
      validators: [noPersonalDataValidator('email', 'alias', 'password')]
    });
  }



  // Helper para obtener errores como array para mostrar la lista completa
  getPasswordErrors(): string[] {
    const errors = this.registerForm.get('password')?.errors;
    if (!errors) return [];
    return Object.values(errors).filter(val => typeof val === 'string') as string[];
  }

  // --- FORMATEO EN TIEMPO REAL ---

  onRutInput(event: any) {
    let input = event.target.value;
    let formatted = this.formatRut(input);
    this.registerForm.get('rut')?.setValue(formatted, { emitEvent: false });
    event.target.value = formatted;
  }

  private formatRut(rut: string): string {
    if (!rut) return '';
    let value = rut.replace(/[^0-9kK]/g, '');
    if (value.length < 2) return value;
    
    let cuerpo = value.slice(0, -1);
    let dv = value.slice(-1).toUpperCase();
    
    let result = '';
    while (cuerpo.length > 3) {
      result = '.' + cuerpo.slice(-3) + result;
      cuerpo = cuerpo.slice(0, -3);
    }
    result = cuerpo + result;
    
    return result + '-' + dv;
  }

  onPhoneInput(event: any) {
    let input = event.target.value;
    let formatted = input.replace(/[^\d+]/g, '');
    this.registerForm.get('telefono')?.setValue(formatted, { emitEvent: false });
    event.target.value = formatted;
  }

  onSubmit() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.cargando = true;

    Swal.fire({
      title: 'Procesando registro y firma digital...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    const datos = { ...this.registerForm.value };
    
    // Formatear Teléfono (Asegurar +56)
    let phone = datos.telefono.trim();
    if (phone && !phone.startsWith('+')) {
      if (phone.startsWith('56')) {
        phone = '+' + phone;
      } else {
        phone = '+56' + phone;
      }
    }
    datos.telefono = phone;

    this.authService.register(datos).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: '¡Cuenta Creada!',
          text: 'Ahora puedes iniciar sesión con tus datos.',
          confirmButtonColor: '#6366f1',
          confirmButtonText: 'Ir al Login'
        }).then(() => {
          this.router.navigate(['/login']);
        });
      },
      error: (err) => {
        this.cargando = false;
        if (err.status === 400 && err.error && typeof err.error === 'object') {
          const allErrors = Object.values(err.error).flat().join('<br>');
          this.mensajeError = allErrors;
          Swal.fire({ title: 'Error de Validación', html: allErrors, icon: 'error' });
        } else {
          this.mensajeError = err.error?.message || err.error?.error || err.message || 'Error al registrarse.';
          Swal.fire('Error', this.mensajeError, 'error');
        }
      }
    });
  }
}
