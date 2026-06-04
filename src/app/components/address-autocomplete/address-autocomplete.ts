import { Component, OnInit, Output, EventEmitter, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap, filter, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { AddressService } from '../../services/address.service';

export interface DireccionEstructurada {
  direccionCompleta: string;
  calle: string;
  comuna: string;
  region: string;
}

@Component({
  selector: 'app-address-autocomplete',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './address-autocomplete.html',
  styleUrl: './address-autocomplete.scss'
})
export class AddressAutocompleteComponent implements OnInit {
  @Input() placeholderText: string = 'Ingresa tu dirección...';
  @Input() initialValue: string = '';
  @Output() direccionSeleccionada = new EventEmitter<DireccionEstructurada>();

  searchControl = new FormControl('');
  sugerencias: any[] = [];
  mostrandoSugerencias = false;
  cargando = false;

  private addressService = inject(AddressService);

  ngOnInit() {
    if (this.initialValue) {
      this.searchControl.setValue(this.initialValue, { emitEvent: false });
    }

    this.searchControl.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      filter(value => {
        if (!value || value.length < 3) {
          this.sugerencias = [];
          this.mostrandoSugerencias = false;
          return false;
        }
        return true;
      }),
      switchMap(value => {
        this.cargando = true;
        return this.addressService.searchAddress(value!).pipe(
          catchError(err => {
            console.error('Error buscando dirección', err);
            return of([]);
          })
        );
      })
    ).subscribe(resultados => {
      this.cargando = false;
      this.sugerencias = resultados;
      this.mostrandoSugerencias = this.sugerencias.length > 0;
    });
  }

  seleccionarDireccion(item: any) {
    const userInput = this.searchControl.value || '';
    const numberMatch = userInput.match(/\d+/);
    const houseNumber = numberMatch ? numberMatch[0] : '';

    let displayName = item.display_name;
    const addr = item.address || {};
    let calle = addr.road || addr.pedestrian || item.name || '';

    // 🌟 EL HACK PARA LATINOAMÉRICA: OpenStreetMap suele no tener los números de casa mapeados.
    // Si el usuario escribió un número, pero OSM no lo devolvió, se lo inyectamos de vuelta a la fuerza.
    if (houseNumber && !displayName.includes(houseNumber)) {
      if (calle && displayName.includes(calle)) {
        displayName = displayName.replace(calle, `${calle} ${houseNumber}`);
      } else {
        displayName = `${calle} ${houseNumber}, ${displayName}`;
      }
      calle = `${calle} ${houseNumber}`.trim();
    }

    // 1. Actualizar el input visible
    this.searchControl.setValue(displayName, { emitEvent: false });
    
    // 2. Ocultar la lista flotante
    this.mostrandoSugerencias = false;

    // 3. Extraer y mapear los campos (El "Secreto" del Backend)
    const comuna = addr.city || addr.town || addr.village || addr.municipality || addr.suburb || '';
    
    const estructurada: DireccionEstructurada = {
      direccionCompleta: displayName,
      calle: calle,
      comuna: comuna,
      region: addr.state || addr.region || ''
    };

    // Imprimir por consola para confirmar
    console.log('Dirección Estructurada Extraída (Con Numeración Corregida):', estructurada);

    // Emitir mediante @Output
    this.direccionSeleccionada.emit(estructurada);
  }

  // Ocultar sugerencias si hace clic fuera (opcional, pero buena práctica UI)
  onBlur() {
    setTimeout(() => this.mostrandoSugerencias = false, 200);
  }
}
