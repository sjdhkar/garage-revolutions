import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-pagination',
    standalone: true,
    imports: [CommonModule],
    template: `
    @if (totalPages > 1) {
      <div class="d-flex justify-content-between align-items-center px-3 py-2">
        <span class="text-muted small">Page {{ page + 1 }} of {{ totalPages }} ({{ totalItems }} total)</span>
        <div>
          <button class="btn btn-sm btn-outline-secondary me-1" [disabled]="page === 0" (click)="pageChange.emit(page - 1)">Previous</button>
          <button class="btn btn-sm btn-outline-secondary" [disabled]="page >= totalPages - 1" (click)="pageChange.emit(page + 1)">Next</button>
        </div>
      </div>
    }
  `
})
export class PaginationComponent {
    @Input({ required: true }) page = 0;
    @Input({ required: true }) pageSize = 20;
    @Input({ required: true }) totalItems = 0;
    @Output() pageChange = new EventEmitter<number>();

    get totalPages(): number {
        return Math.max(1, Math.ceil(this.totalItems / this.pageSize));
    }
}
