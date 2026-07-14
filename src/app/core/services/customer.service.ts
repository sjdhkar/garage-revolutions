import { Injectable, signal, effect } from '@angular/core';
import { Customer } from '../models/app.models';
import { db, isFirebaseConfigured } from '../configs/firebase.config';
import { collection, onSnapshot, doc, setDoc, updateDoc } from 'firebase/firestore';

@Injectable({
    providedIn: 'root'
})
export class CustomerService {
    readonly customers = signal<Customer[]>([]);
    private unsubscribeFirestore?: () => void;

    constructor() {
        if (isFirebaseConfigured && db) {
            const customersRef = collection(db, 'customers');
            this.unsubscribeFirestore = onSnapshot(customersRef, (snapshot) => {
                const list: Customer[] = [];
                snapshot.forEach((docVal) => {
                    list.push(docVal.data() as Customer);
                });
                this.customers.set(list);
            }, (error) => {
                console.error("Firestore customer read error:", error);
            });
        } else {
            this.customers.set(this.loadCustomers());
            effect(() => {
                this.saveCustomers(this.customers());
            });
        }
    }

    getCustomers() {
        return this.customers.asReadonly();
    }

    getCustomer(mobile: string): Customer | undefined {
        return this.customers().find(c => c.mobile === mobile);
    }

    addCustomer(customer: Customer): void {
        if (isFirebaseConfigured && db) {
            const docRef = doc(db, 'customers', customer.mobile);
            setDoc(docRef, customer).catch(err => console.error("Error adding customer:", err));
        } else {
            this.customers.update(list => [...list, customer]);
        }
    }

    updateCustomer(mobile: string, updates: Partial<Customer>): void {
        if (isFirebaseConfigured && db) {
            const docRef = doc(db, 'customers', mobile);
            updateDoc(docRef, updates).catch(err => console.error("Error updating customer:", err));
        } else {
            this.customers.update(list =>
                list.map(c => c.mobile === mobile ? { ...c, ...updates } : c)
            );
        }
    }

    private loadCustomers(): Customer[] {
        const data = localStorage.getItem('garage_customers');
        return data ? JSON.parse(data) : [];
    }

    private saveCustomers(customers: Customer[]): void {
        localStorage.setItem('garage_customers', JSON.stringify(customers));
    }
}
