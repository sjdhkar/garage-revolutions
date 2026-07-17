export interface Garage {
    id: string;
    name: string;
    address: string;
    phone: string;
    upiId: string;
    gstNumber?: string;
    panNumber?: string;
    website?: string;
    logoUrl?: string;
    coverImageUrl?: string;
    invoiceLogoUrl?: string;
    upiQrImageUrl?: string;
    primaryColor?: string; // hex, e.g. #6366f1 — drives --accent-500 at runtime
    secondaryColor?: string; // hex — drives --accent-secondary at runtime
    taxRate: number; // flat GST percent applied to every invoice, e.g. 18
    setupCompleted: boolean;
    createdAt: string;
}
