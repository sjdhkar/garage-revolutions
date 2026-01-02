import { Injectable, signal, effect } from '@angular/core';
import { Customer } from '../models/app.models';

@Injectable({
    providedIn: 'root'
})
export class CustomerService {
    readonly customers = signal<Customer[]>(this.loadCustomers());

    constructor() {
        effect(() => {
            this.saveCustomers(this.customers());
        });
    }

    getCustomers() {
        return this.customers.asReadonly();
    }

    getCustomer(mobile: string): Customer | undefined {
        return this.customers().find(c => c.mobile === mobile);
    }

    addCustomer(customer: Customer): void {
        this.customers.update(list => [...list, customer]);
    }

    updateCustomer(mobile: string, updates: Partial<Customer>): void {
        this.customers.update(list =>
            list.map(c => c.mobile === mobile ? { ...c, ...updates } : c)
        );
    }

    private loadCustomers(): Customer[] {
        const data = localStorage.getItem('garage_customers');
        return data ? JSON.parse(data) : [];
    }

    private saveCustomers(customers: Customer[]): void {
        localStorage.setItem('garage_customers', JSON.stringify(customers));
    }
}
