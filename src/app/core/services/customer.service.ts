import { Injectable, signal } from '@angular/core';
import { Customer } from '../models/app.models';
import { db } from '../configs/firebase.config';
import { collection, onSnapshot, doc, setDoc, updateDoc } from 'firebase/firestore';

@Injectable({
    providedIn: 'root'
})
export class CustomerService {
    readonly customers = signal<Customer[]>([]);

    constructor() {
        const customersRef = collection(db!, 'customers');
        onSnapshot(customersRef, (snapshot) => {
            const list: Customer[] = [];
            snapshot.forEach((d) => list.push(d.data() as Customer));
            this.customers.set(list);
        }, (error) => {
            console.error("Firestore customer read error:", error);
        });
    }

    getCustomers() {
        return this.customers.asReadonly();
    }

    getCustomer(mobile: string): Customer | undefined {
        return this.customers().find(c => c.mobile === mobile);
    }

    addCustomer(customer: Customer): void {
        const docRef = doc(db!, 'customers', customer.mobile);
        setDoc(docRef, customer).catch(err => console.error("Error adding customer:", err));
    }

    updateCustomer(mobile: string, updates: Partial<Customer>): void {
        const docRef = doc(db!, 'customers', mobile);
        updateDoc(docRef, updates).catch(err => console.error("Error updating customer:", err));
    }
}
