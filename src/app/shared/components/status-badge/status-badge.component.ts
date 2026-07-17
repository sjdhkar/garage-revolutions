import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-status-badge',
    standalone: true,
    imports: [CommonModule],
    template: `<span class="badge" [ngClass]="badgeClass">{{ status }}</span>`
})
export class StatusBadgeComponent {
    @Input({ required: true }) status!: string;

    get badgeClass(): string {
        switch (this.status) {
            case 'RECEIVED': return 'bg-secondary';
            case 'IN_PROGRESS': return 'bg-primary';
            case 'WAITING_PARTS': return 'bg-warning text-dark';
            case 'COMPLETED': return 'bg-success';
            case 'DELIVERED': return 'bg-dark';
            default: return 'bg-secondary';
        }
    }
}
