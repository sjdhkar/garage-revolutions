import { JobCard } from '../models/app.models';

// The single source of truth for "how much does this job card come to" —
// this logic used to be duplicated three times (BillingService, JobCardDetailComponent,
// ReportsComponent), independently, with no tax/discount handling anywhere.

export function calculatePartsTotal(job: Pick<JobCard, 'parts'>): number {
    return job.parts.reduce((sum, p) => sum + p.price * p.quantity, 0);
}

export function calculateServicesTotal(job: Pick<JobCard, 'services'>): number {
    return job.services.reduce((sum, s) => sum + (s.cost || 0), 0);
}

export interface BillTotals {
    subtotal: number;
    discount: number;
    taxRate: number;
    taxAmount: number;
    total: number;
}

export function calculateBillTotals(
    job: Pick<JobCard, 'parts' | 'services'>,
    taxRatePercent: number,
    discount: number = 0
): BillTotals {
    const subtotal = calculatePartsTotal(job) + calculateServicesTotal(job);
    const afterDiscount = Math.max(0, subtotal - discount);
    const taxAmount = Math.round(afterDiscount * (taxRatePercent / 100) * 100) / 100;
    const total = Math.round((afterDiscount + taxAmount) * 100) / 100;
    return { subtotal, discount, taxRate: taxRatePercent, taxAmount, total };
}
