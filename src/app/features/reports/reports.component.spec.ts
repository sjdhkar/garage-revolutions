import { describe, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { ReportsComponent } from './reports.component';
import { JobCardService } from '../../core/services/job-card.service';
import { InventoryService } from '../../core/services/inventory.service';
import { InvoiceService } from '../../core/services/invoice.service';
import { TeamService } from '../../core/services/team.service';
import { AuthService } from '../../core/services/auth.service';
import { AppUser, UserRole } from '../../core/models/user.model';

function buildComponent(role: UserRole) {
    const currentUser = signal<AppUser | null>({
        id: 'u1', role, name: 'Test', email: 't@example.com', garageId: 'main', status: 'active',
        provider: 'email', emailVerified: true, createdAt: '', updatedAt: '', lastLogin: '',
    });

    TestBed.configureTestingModule({
        imports: [ReportsComponent],
        providers: [
            provideRouter([]),
            { provide: JobCardService, useValue: { jobCards: signal([]) } },
            { provide: InventoryService, useValue: { inventory: signal([]), lowStockItems: signal([]) } },
            { provide: InvoiceService, useValue: { invoices: signal([]) } },
            { provide: TeamService, useValue: { getMember: () => undefined } },
            { provide: AuthService, useValue: { currentUser } },
        ],
    });

    return TestBed.createComponent(ReportsComponent).componentInstance;
}

describe('ReportsComponent RBAC', () => {
    const cases: Array<[UserRole, boolean, boolean, boolean]> = [
        // role, revenue, pendingPayments, ownerReports
        ['owner', true, true, true],
        ['admin', true, true, true],
        ['accountant', true, true, false],
        ['receptionist', false, true, false],
        ['technician', false, false, false],
    ];

    cases.forEach(([role, revenue, pendingPayments, ownerReports]) => {
        it(`gates sections correctly for ${role}`, () => {
            const component = buildComponent(role);
            expect(component.canViewRevenue()).toBe(revenue);
            expect(component.canViewPendingPayments()).toBe(pendingPayments);
            expect(component.canViewOwnerReports()).toBe(ownerReports);
        });
    });
});
