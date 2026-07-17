import { Injectable, signal, inject } from '@angular/core';
import { Invoice, InvoiceLineItem, PaymentRecord, PaymentMode } from '../models/billing.model';
import { JobCard } from '../models/app.models';
import { db } from '../configs/firebase.config';
import { DEFAULT_GARAGE_ID } from '../configs/garage.constants';
import { AuthService } from './auth.service';
import { calculateBillTotals } from '../utils/billing-calculations';
import {
    collection, query, where, orderBy, onSnapshot, doc, setDoc, updateDoc, getDocs, runTransaction
} from 'firebase/firestore';

@Injectable({ providedIn: 'root' })
export class InvoiceService {
    private authService = inject(AuthService);

    readonly invoices = signal<Invoice[]>([]);

    constructor() {
        const invoicesQuery = query(
            collection(db!, 'invoices'),
            where('garageId', '==', DEFAULT_GARAGE_ID)
        );
        onSnapshot(invoicesQuery, (snapshot) => {
            const list: Invoice[] = [];
            snapshot.forEach((d) => list.push(d.data() as Invoice));
            list.sort((a, b) => b.invoiceNumber - a.invoiceNumber);
            this.invoices.set(list);
        }, (error) => {
            console.error('Firestore invoices read error:', error);
        });
    }

    /** The active (non-voided) invoice for a job card, if any — a voided invoice no longer blocks re-invoicing. */
    getInvoiceForJobCard(jobCardId: string): Invoice | undefined {
        return this.invoices().find(inv => inv.jobCardId === jobCardId && !inv.voided);
    }

    /** Only permitted before any payment has been recorded — see firestore.rules for the enforced boundary. */
    async voidInvoice(invoiceId: string): Promise<void> {
        await updateDoc(doc(db!, 'invoices', invoiceId), { voided: true });
    }

    /** Creates an immutable invoice snapshot from a job card's current parts/services. */
    async createInvoiceFromJobCard(job: JobCard, taxRate: number, discount: number = 0): Promise<Invoice> {
        const lineItems: InvoiceLineItem[] = [
            ...job.parts.map(p => ({
                type: 'part' as const,
                description: p.name,
                quantity: p.quantity,
                unitPrice: p.price,
                total: p.price * p.quantity,
            })),
            ...job.services.map(s => ({
                type: 'service' as const,
                description: s.description,
                quantity: 1,
                unitPrice: s.cost,
                total: s.cost,
            })),
        ];
        const totals = calculateBillTotals(job, taxRate, discount);
        const uid = this.authService.currentUser()?.id ?? 'unknown';

        const invoiceRef = doc(collection(db!, 'invoices'));
        const counterRef = doc(db!, 'garages', DEFAULT_GARAGE_ID, 'counters', 'invoices');

        const invoice = await runTransaction(db!, async (tx) => {
            const counterSnap = await tx.get(counterRef);
            const nextNumber = ((counterSnap.data()?.['value'] as number) ?? 0) + 1;
            tx.set(counterRef, { value: nextNumber }, { merge: true });

            const newInvoice: Invoice = {
                id: invoiceRef.id,
                garageId: DEFAULT_GARAGE_ID,
                invoiceNumber: nextNumber,
                jobCardId: job.id,
                customerMobile: job.customerMobile,
                lineItems,
                subtotal: totals.subtotal,
                discount: totals.discount,
                taxRate: totals.taxRate,
                taxAmount: totals.taxAmount,
                total: totals.total,
                amountPaid: 0,
                paymentStatus: 'PENDING',
                issuedAt: new Date().toISOString(),
                issuedBy: uid,
            };
            tx.set(invoiceRef, newInvoice);
            return newInvoice;
        });

        return invoice;
    }

    async recordPayment(invoiceId: string, amount: number, mode: PaymentMode): Promise<void> {
        const uid = this.authService.currentUser()?.id ?? 'unknown';
        const invoiceRef = doc(db!, 'invoices', invoiceId);
        const paymentRef = doc(collection(db!, 'invoices', invoiceId, 'payments'));

        await runTransaction(db!, async (tx) => {
            const snap = await tx.get(invoiceRef);
            const invoice = snap.data() as Invoice | undefined;
            if (!invoice) throw new Error('Invoice not found');

            const newAmountPaid = invoice.amountPaid + amount;
            const paymentStatus = newAmountPaid >= invoice.total ? 'PAID' : (newAmountPaid > 0 ? 'PARTIAL' : 'PENDING');

            tx.set(paymentRef, {
                id: paymentRef.id,
                amount,
                mode,
                paidAt: new Date().toISOString(),
                recordedBy: uid,
            } as PaymentRecord);
            tx.update(invoiceRef, { amountPaid: newAmountPaid, paymentStatus });
        });
    }

    async getPayments(invoiceId: string): Promise<PaymentRecord[]> {
        const paymentsQuery = query(collection(db!, 'invoices', invoiceId, 'payments'), orderBy('paidAt', 'desc'));
        const snap = await getDocs(paymentsQuery);
        return snap.docs.map(d => d.data() as PaymentRecord);
    }
}
