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
    private isUsingFallback = false;

    constructor() {
        this.initializeData();
    }

    private initializeData() {
        if (isFirebaseConfigured && db) {
            const customersRef = collection(db, 'customers');
            this.unsubscribeFirestore = onSnapshot(customersRef, (snapshot) => {
                const list: Customer[] = [];
                snapshot.forEach((docVal) => {
                    list.push(docVal.data() as Customer);
                });
                this.customers.set(list);
                this.isUsingFallback = false;
            }, (error) => {
                console.error("Firestore customer read error (falling back to LocalStorage):", error);
                this.activateFallback();
            });
        } else {
            this.activateFallback();
        }
    }

    private activateFallback() {
        this.isUsingFallback = true;
        this.customers.set(this.loadCustomers());
        try {
            effect(() => {
                if (this.isUsingFallback) {
                    this.saveCustomers(this.customers());
                }
            });
        } catch (e) {
            // Safe catch if called outside injection context
        }
    }

    getCustomers() {
        return this.customers.asReadonly();
    }

    getCustomer(mobile: string): Customer | undefined {
        return this.customers().find(c => c.mobile === mobile);
    }

    addCustomer(customer: Customer): void {
        if (isFirebaseConfigured && db && !this.isUsingFallback) {
            const docRef = doc(db, 'customers', customer.mobile);
            setDoc(docRef, customer).catch(err => {
                console.error("Error adding customer (falling back to LocalStorage):", err);
                this.isUsingFallback = true;
                this.customers.update(list => [...list, customer]);
                this.saveCustomers(this.customers());
            });
        } else {
            this.customers.update(list => [...list, customer]);
            if (this.isUsingFallback) this.saveCustomers(this.customers());
        }
    }

    updateCustomer(mobile: string, updates: Partial<Customer>): void {
        if (isFirebaseConfigured && db && !this.isUsingFallback) {
            const docRef = doc(db, 'customers', mobile);
            updateDoc(docRef, updates).catch(err => {
                console.error("Error updating customer (falling back to LocalStorage):", err);
                this.isUsingFallback = true;
                this.customers.update(list =>
                    list.map(c => c.mobile === mobile ? { ...c, ...updates } : c)
                );
                this.saveCustomers(this.customers());
            });
        } else {
            this.customers.update(list =>
                list.map(c => c.mobile === mobile ? { ...c, ...updates } : c)
            );
            if (this.isUsingFallback) this.saveCustomers(this.customers());
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
