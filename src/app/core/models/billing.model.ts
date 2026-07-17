export interface InvoiceLineItem {
    type: 'part' | 'service';
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
}

export type InvoicePaymentStatus = 'PENDING' | 'PARTIAL' | 'PAID';
export type PaymentMode = 'CASH' | 'UPI' | 'CARD' | 'OTHER';

export interface Invoice {
    id: string;
    garageId: string;
    invoiceNumber: number; // sequential, human-friendly (garage-scoped counter)
    jobCardId: string;
    customerMobile: string;
    lineItems: InvoiceLineItem[];
    subtotal: number;
    discount: number;
    taxRate: number;
    taxAmount: number;
    total: number;
    amountPaid: number;
    paymentStatus: InvoicePaymentStatus;
    issuedAt: string;
    issuedBy: string; // uid
    voided?: boolean; // once true, the job card can be edited again and a fresh invoice generated
}

export interface PaymentRecord {
    id: string;
    amount: number;
    mode: PaymentMode;
    paidAt: string;
    recordedBy: string; // uid
}

export type QuotationStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'DECLINED';

export interface QuotationLineItem {
    description: string;
    quantity: number;
    unitPrice: number;
}

export interface Quotation {
    id: string;
    garageId: string;
    quotationNumber: number;
    customerMobile: string;
    customerName: string;
    lineItems: QuotationLineItem[];
    total: number;
    status: QuotationStatus;
    createdAt: string;
    createdBy: string; // uid
}
