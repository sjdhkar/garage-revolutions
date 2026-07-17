import { Injectable, signal } from '@angular/core';

export interface Toast {
    id: number;
    message: string;
    type: 'success' | 'error' | 'info';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
    readonly toasts = signal<Toast[]>([]);
    private nextId = 1;

    success(message: string): void { this.push(message, 'success'); }
    error(message: string): void { this.push(message, 'error'); }
    info(message: string): void { this.push(message, 'info'); }

    dismiss(id: number): void {
        this.toasts.update(list => list.filter(t => t.id !== id));
    }

    private push(message: string, type: Toast['type']): void {
        const id = this.nextId++;
        this.toasts.update(list => [...list, { id, message, type }]);
        setTimeout(() => this.dismiss(id), 4000);
    }
}
