import { Component, EventEmitter, Output, signal } from '@angular/core';

@Component({
  selector: 'app-terms-modal',
  templateUrl: './terms-modal.html',
  styleUrl: './terms-modal.css',
})
export class TermsModal {
  @Output() accepted = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  readonly checked = signal(false);

  accept(): void {
    if (!this.checked()) return;
    this.accepted.emit();
  }

  cancel(): void {
    this.cancelled.emit();
  }
}
