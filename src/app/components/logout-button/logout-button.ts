import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-logout-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './logout-button.html',
  styleUrl: './logout-button.scss',
})
export class LogoutButton {
  @Output() logout = new EventEmitter<void>();

  onLogout() {
    this.logout.emit();
  }
}
