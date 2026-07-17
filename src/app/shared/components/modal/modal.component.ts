import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-modal',
    standalone: true,
    imports: [CommonModule],
    template: `
    @if (open) {
      <div class="modal-backdrop-custom" (click)="onBackdropClick($event)">
        <div class="modal-panel" (click)="$event.stopPropagation()">
          <div class="modal-panel-header">
            <h5 class="modal-panel-title">{{ title }}</h5>
            <button type="button" class="btn-close" (click)="close.emit()"></button>
          </div>
          <div class="modal-panel-body">
            <ng-content></ng-content>
          </div>
        </div>
      </div>
    }
  `,
    styles: [`
    .modal-backdrop-custom {
      position: fixed;
      inset: 0;
      background: rgba(24, 24, 27, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1050;
      padding: 1rem;
    }
    .modal-panel {
      background: var(--surface, #fff);
      border-radius: var(--radius-lg, 12px);
      border: 1px solid var(--border, #e4e4e7);
      box-shadow: var(--shadow-md, 0 2px 8px rgba(0,0,0,0.08));
      width: 100%;
      max-width: 480px;
      max-height: 90vh;
      overflow-y: auto;
    }
    .modal-panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1.25rem;
      border-bottom: 1px solid var(--border, #e4e4e7);
    }
    .modal-panel-title {
      margin: 0;
      font-size: var(--text-lg, 1.125rem);
      font-weight: 600;
    }
    .modal-panel-body {
      padding: 1.25rem;
    }
  `]
})
export class ModalComponent {
    @Input({ required: true }) open = false;
    @Input() title = '';
    @Output() close = new EventEmitter<void>();

    onBackdropClick(event: MouseEvent): void {
        event.stopPropagation();
        this.close.emit();
    }
}
