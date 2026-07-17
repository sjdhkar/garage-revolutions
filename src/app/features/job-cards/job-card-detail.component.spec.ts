import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { convertToParamMap, ActivatedRoute } from '@angular/router';
import { signal } from '@angular/core';
import { JobCardDetailComponent } from './job-card-detail.component';
import { JobCardService } from '../../core/services/job-card.service';
import { CustomerService } from '../../core/services/customer.service';
import { VehicleService } from '../../core/services/vehicle.service';
import { InventoryService } from '../../core/services/inventory.service';
import { WhatsappService } from '../../core/services/whatsapp.service';
import { GarageService } from '../../core/services/garage.service';
import { ServiceCatalogService } from '../../core/services/service-catalog.service';
import { AuthService } from '../../core/services/auth.service';
import { TeamService } from '../../core/services/team.service';
import { InvoiceService } from '../../core/services/invoice.service';
import { AppUser } from '../../core/models/user.model';
import { Invoice } from '../../core/models/billing.model';
import { JobCard } from '../../core/models/app.models';

function buildFixture(role: AppUser['role'], invoice?: Invoice) {
    const currentUser = signal<AppUser | null>({
        id: 'u1', role, name: 'Test', email: 't@example.com', garageId: 'main', status: 'active',
        provider: 'email', emailVerified: true, createdAt: '', updatedAt: '', lastLogin: '',
    });

    const job: JobCard = {
        id: 'job1', garageId: 'main', customerMobile: '9999999999', vehicleId: 'v1',
        complaint: '', services: [], parts: [], status: 'RECEIVED',
        assignedTechnicianId: '', internalNotes: '', createdAt: '', updatedAt: '',
    } as unknown as JobCard;

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
        imports: [JobCardDetailComponent],
        providers: [
            { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ id: 'job1' })) } },
            { provide: JobCardService, useValue: { getJobCard: () => job, jobCards: signal([job]) } },
            { provide: CustomerService, useValue: { getCustomer: () => null } },
            { provide: VehicleService, useValue: { getVehicle: () => null } },
            { provide: InventoryService, useValue: { inventory: signal([]) } },
            { provide: WhatsappService, useValue: { openChat: () => {} } },
            { provide: GarageService, useValue: { garage: signal(null) } },
            { provide: ServiceCatalogService, useValue: { activeServices: signal([]) } },
            { provide: AuthService, useValue: { currentUser } },
            { provide: TeamService, useValue: { technicians: signal([]), getMember: () => undefined } },
            { provide: InvoiceService, useValue: { getInvoiceForJobCard: () => invoice } },
        ],
    });

    const fixture = TestBed.createComponent(JobCardDetailComponent);
    fixture.componentInstance.ngOnInit();
    return fixture.componentInstance;
}

function buildInvoice(overrides: Partial<Invoice> = {}): Invoice {
    return {
        id: 'inv1', garageId: 'main', invoiceNumber: 1, jobCardId: 'job1', customerMobile: '9999999999',
        lineItems: [], subtotal: 200, discount: 0, taxRate: 18, taxAmount: 36, total: 236,
        amountPaid: 0, paymentStatus: 'PENDING', issuedAt: '2026-01-01', issuedBy: 'owner-uid',
        ...overrides,
    };
}

describe('JobCardDetailComponent RBAC', () => {
    (['owner', 'admin', 'receptionist', 'accountant'] as const).forEach(role => {
        it(`canViewBilling is true for ${role}`, () => {
            const component = buildFixture(role);
            expect(component.canViewBilling()).toBe(true);
        });
    });

    it('canViewBilling is false for technician', () => {
        const component = buildFixture('technician');
        expect(component.canViewBilling()).toBe(false);
    });

    it('canAssignTechnician is false for technician', () => {
        const component = buildFixture('technician');
        expect(component.canAssignTechnician()).toBe(false);
    });

    it('canAssignTechnician is true for owner', () => {
        const component = buildFixture('owner');
        expect(component.canAssignTechnician()).toBe(true);
    });
});

describe('JobCardDetailComponent invoice locking', () => {
    it('hasActiveInvoice is false when no invoice exists', () => {
        const component = buildFixture('owner');
        expect(component.hasActiveInvoice()).toBe(false);
    });

    it('hasActiveInvoice is true once an invoice has been generated', () => {
        const component = buildFixture('owner', buildInvoice());
        expect(component.hasActiveInvoice()).toBe(true);
    });

    it('canVoidInvoice is true for owner/admin on an unpaid invoice', () => {
        expect(buildFixture('owner', buildInvoice({ amountPaid: 0 })).canVoidInvoice()).toBe(true);
        expect(buildFixture('admin', buildInvoice({ amountPaid: 0 })).canVoidInvoice()).toBe(true);
    });

    it('canVoidInvoice is false once a payment has been recorded', () => {
        const component = buildFixture('owner', buildInvoice({ amountPaid: 50 }));
        expect(component.canVoidInvoice()).toBe(false);
    });

    it('canVoidInvoice is false for non-admin/owner roles', () => {
        expect(buildFixture('receptionist', buildInvoice()).canVoidInvoice()).toBe(false);
        expect(buildFixture('technician', buildInvoice()).canVoidInvoice()).toBe(false);
    });
});
