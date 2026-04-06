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

  ngOnInit() {
    this.registerForm = this.fb.group({
      nombre: ['', [Validators.required]],
      alias: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(20)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, passwordValidator()]],
      telefono: [''],
      direccion: [''],
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

    // ⚖️ Primero registramos la aceptación legal auditada (IP, User-Agent, Timestamp)
    this.productService.acceptLegalTerms('USER_REGISTRATION').subscribe({
      next: () => {
        this.authService.register(this.registerForm.value).subscribe({
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
      },
      error: (err) => {
        this.cargando = false;
        Swal.fire('Error Legal', 'No pudimos registrar tu firma digital legal. Por favor, intenta de nuevo.', 'error');
      }
    });
  }
}