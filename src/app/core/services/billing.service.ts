import { Injectable } from '@angular/core';
import { JobCard } from '../models/app.models';

@Injectable({
    providedIn: 'root'
})
export class BillingService {

    calculateTotal(job: JobCard): number {
        const partsTotal = job.parts.reduce((sum, part) => sum + (part.price * part.quantity), 0);
        // Add logic for service charges if needed, for now assuming services are text only or handled elsewhere
        // If services have cost, they should be structured differently. 
        // For this MVP, we will assume manual total update or just parts.
        // Spec says 'Auto-calculate total', but 'Services' in JobCardDetail says 'Services'.
        // We'll treat services as having a cost if we update the model, but for now lets return parts total.
        return partsTotal;
    }

    // In future, generate PDF or handle payment gateway logic here
}
