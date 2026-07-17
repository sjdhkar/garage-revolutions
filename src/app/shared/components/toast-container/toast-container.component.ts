import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast.service';

@Component({
    selector: 'app-toast-container',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="toast-stack">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast-item" [ngClass]="'toast-' + toast.type" (click)="toastService.dismiss(toast.id)">
          <i class="bi" [ngClass]="iconFor(toast.type)"></i>
          <span>{{ toast.message }}</span>
        </div>
      }
    </div>
  `,
    styles: [`
    .toast-stack {
      position: fixed;
      bottom: var(--space-5, 1.5rem);
      right: var(--space-5, 1.5rem);
      z-index: 2000;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      max-width: 360px;
    }
    .toast-item {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      background: var(--surface, #fff);
      border: 1px solid var(--border, #e4e4e7);
      border-radius: var(--radius-md, 8px);
      box-shadow: var(--shadow-md, 0 2px 8px rgba(0,0,0,0.08));
      padding: 0.75rem 1rem;
      font-size: var(--text-sm, 0.875rem);
      cursor: pointer;
      animation: toast-in 0.15s ease-out;
    }
    .toast-success { border-left: 3px solid var(--success-500, #16a34a); }
    .toast-error { border-left: 3px solid var(--danger-500, #dc2626); }
    .toast-info { border-left: 3px solid var(--accent-500, #6366f1); }
    .toast-success i { color: var(--success-500, #16a34a); }
    .toast-error i { color: var(--danger-500, #dc2626); }
    .toast-info i { color: var(--accent-500, #6366f1); }
    @keyframes toast-in {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class ToastContainerComponent {
    readonly toastService = inject(ToastService);

    iconFor(type: 'success' | 'error' | 'info'): string {
        switch (type) {
            case 'success': return 'bi-check-circle-fill';
            case 'error': return 'bi-exclamation-circle-fill';
            case 'info': return 'bi-info-circle-fill';
        }
    }
}
