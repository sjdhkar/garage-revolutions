import { Injectable, signal, inject } from '@angular/core';
import { Customer } from '../models/app.models';
import { db } from '../configs/firebase.config';
import { DEFAULT_GARAGE_ID } from '../configs/garage.constants';
import { LoggingService } from './logging.service';
import { collection, query, where, onSnapshot, doc, setDoc, updateDoc } from 'firebase/firestore';

@Injectable({
    providedIn: 'root'
})
export class CustomerService {
    private loggingService = inject(LoggingService);

    readonly customers = signal<Customer[]>([]);

    constructor() {
        const customersQuery = query(
            collection(db!, 'customers'),
            where('garageId', '==', DEFAULT_GARAGE_ID)
        );
        onSnapshot(customersQuery, (snapshot) => {
            const list: Customer[] = [];
            snapshot.forEach((d) => list.push(d.data() as Customer));
            this.customers.set(list);
        }, (error) => {
            this.loggingService.logError('customer.service:onSnapshot', error);
        });
    }

    getCustomers() {
        return this.customers.asReadonly();
    }

    getCustomer(mobile: string): Customer | undefined {
        return this.customers().find(c => c.mobile === mobile);
    }

    async addCustomer(customer: Omit<Customer, 'garageId'>): Promise<void> {
        const docRef = doc(db!, 'customers', customer.mobile);
        await setDoc(docRef, { ...customer, garageId: DEFAULT_GARAGE_ID });
    }

    async updateCustomer(mobile: string, updates: Partial<Customer>): Promise<void> {
        const docRef = doc(db!, 'customers', mobile);
        await updateDoc(docRef, updates);
    }
}
