import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupportService, SupportTicket } from '../../services/support';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-support',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './support.html',
  styleUrl: './support.scss'
})
export class SupportComponent implements OnInit {
  private supportService = inject(SupportService);

  tickets: SupportTicket[] = [];
  nuevoTicket: SupportTicket = {
    asunto: '',
    mensaje: ''
  };
  loading = false;

  ngOnInit() {
    this.cargarTickets();
  }

  cargarTickets() {
    this.supportService.getMyTickets().subscribe({
      next: (data) => this.tickets = data,
      error: (err) => console.error('Error cargando tickets', err)
    });
  }

  enviarTicket() {
    if (!this.nuevoTicket.asunto || !this.nuevoTicket.mensaje) {
      Swal.fire('Error', 'Debes completar el asunto y el mensaje.', 'warning');
      return;
    }

    this.loading = true;
    this.supportService.createTicket(this.nuevoTicket).subscribe({
      next: () => {
        this.loading = false;
        Swal.fire({
          icon: 'success',
          title: 'Consulta Enviada',
          text: 'Te responderemos lo antes posible. Revisa esta sección para ver la respuesta.',
          timer: 3000
        });
        this.nuevoTicket = { asunto: '', mensaje: '' };
        this.cargarTickets();
      },
      error: (err) => {
        this.loading = false;
        Swal.fire('Error', 'No se pudo enviar la consulta.', 'error');
      }
    });
  }
}
