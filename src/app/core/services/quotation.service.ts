import { Injectable, signal, inject } from '@angular/core';
import { Quotation, QuotationLineItem, QuotationStatus } from '../models/billing.model';
import { db } from '../configs/firebase.config';
import { DEFAULT_GARAGE_ID } from '../configs/garage.constants';
import { AuthService } from './auth.service';
import { collection, query, where, onSnapshot, doc, updateDoc, runTransaction } from 'firebase/firestore';

@Injectable({ providedIn: 'root' })
export class QuotationService {
    private authService = inject(AuthService);

    readonly quotations = signal<Quotation[]>([]);

    constructor() {
        const quotationsQuery = query(
            collection(db!, 'quotations'),
            where('garageId', '==', DEFAULT_GARAGE_ID)
        );
        onSnapshot(quotationsQuery, (snapshot) => {
            const list: Quotation[] = [];
            snapshot.forEach((d) => list.push(d.data() as Quotation));
            list.sort((a, b) => b.quotationNumber - a.quotationNumber);
            this.quotations.set(list);
        }, (error) => {
            console.error('Firestore quotations read error:', error);
        });
    }

    async createQuotation(customerMobile: string, customerName: string, lineItems: QuotationLineItem[]): Promise<Quotation> {
        const total = lineItems.reduce((sum, li) => sum + li.quantity * li.unitPrice, 0);
        const uid = this.authService.currentUser()?.id ?? 'unknown';

        const quotationRef = doc(collection(db!, 'quotations'));
        const counterRef = doc(db!, 'garages', DEFAULT_GARAGE_ID, 'counters', 'quotations');

        return runTransaction(db!, async (tx) => {
            const counterSnap = await tx.get(counterRef);
            const nextNumber = ((counterSnap.data()?.['value'] as number) ?? 0) + 1;
            tx.set(counterRef, { value: nextNumber }, { merge: true });

            const quotation: Quotation = {
                id: quotationRef.id,
                garageId: DEFAULT_GARAGE_ID,
                quotationNumber: nextNumber,
                customerMobile,
                customerName,
                lineItems,
                total,
                status: 'DRAFT',
                createdAt: new Date().toISOString(),
                createdBy: uid,
            };
            tx.set(quotationRef, quotation);
            return quotation;
        });
    }

    async setStatus(id: string, status: QuotationStatus): Promise<void> {
        await updateDoc(doc(db!, 'quotations', id), { status });
    }
}
