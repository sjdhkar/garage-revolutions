import { Injectable, signal } from '@angular/core';
import { Supplier } from '../models/app.models';
import { db } from '../configs/firebase.config';
import { DEFAULT_GARAGE_ID } from '../configs/garage.constants';
import { collection, query, where, onSnapshot, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';

@Injectable({ providedIn: 'root' })
export class SupplierService {
    readonly suppliers = signal<Supplier[]>([]);

    constructor() {
        const suppliersQuery = query(
            collection(db!, 'suppliers'),
            where('garageId', '==', DEFAULT_GARAGE_ID)
        );
        onSnapshot(suppliersQuery, (snapshot) => {
            const list: Supplier[] = [];
            snapshot.forEach((d) => list.push(d.data() as Supplier));
            this.suppliers.set(list);
        }, (error) => {
            console.error('Firestore suppliers read error:', error);
        });
    }

    getSupplier(id: string): Supplier | undefined {
        return this.suppliers().find(s => s.id === id);
    }

    async addSupplier(supplier: Omit<Supplier, 'id' | 'garageId'>): Promise<string> {
        const docRef = doc(collection(db!, 'suppliers'));
        // Firestore rejects `undefined` field values, so only include the optional
        // contact/phone/email fields when they actually have a value.
        const data: Supplier = { id: docRef.id, garageId: DEFAULT_GARAGE_ID, name: supplier.name };
        if (supplier.contact) data.contact = supplier.contact;
        if (supplier.phone) data.phone = supplier.phone;
        if (supplier.email) data.email = supplier.email;
        await setDoc(docRef, data);
        return docRef.id;
    }

    async updateSupplier(id: string, updates: Partial<Omit<Supplier, 'id' | 'garageId'>>): Promise<void> {
        await updateDoc(doc(db!, 'suppliers', id), updates);
    }

    async deleteSupplier(id: string): Promise<void> {
        await deleteDoc(doc(db!, 'suppliers', id));
    }
}
