import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function passwordValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null;

    const errors: any = {};

    if (value.length < 10) {
      errors.minLength = 'Mínimo 10 caracteres';
    }
    if (!/[A-Z]/.test(value)) {
      errors.noUpper = 'Al menos una letra mayúscula';
    }
    if (!/[a-z]/.test(value)) {
      errors.noLower = 'Al menos una letra minúscula';
    }
    if (!/[0-9]/.test(value)) {
      errors.noNumber = 'Al menos un número';
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
      errors.noSpecial = 'Al menos un carácter especial (@, #, $, %, etc.)';
    }

    // Nota: La validación de datos personales (alias/email) normalmente se hace
    // a nivel del FormGroup para acceder a los otros campos.
    
    return Object.keys(errors).length > 0 ? errors : null;
  };
}

export function noPersonalDataValidator(emailKey: string, aliasKey: string, passwordKey: string): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const email = group.get(emailKey)?.value;
    const alias = group.get(aliasKey)?.value;
    const password = group.get(passwordKey)?.value;

    if (!password) return null;

    const errors: any = {};

    if (email) {
      const emailPrefix = email.split('@')[0].toLowerCase();
      if (password.toLowerCase().includes(emailPrefix)) {
          errors.containsEmail = 'La contraseña no puede contener parte de tu email';
      }
    }

    if (alias && password.toLowerCase().includes(alias.toLowerCase())) {
        errors.containsAlias = 'La contraseña no puede contener tu alias';
    }

    if (Object.keys(errors).length > 0) {
      const passwordControl = group.get(passwordKey);
      passwordControl?.setErrors({ ...passwordControl.errors, ...errors });
    }

    return null;
  };
}
