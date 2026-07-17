export interface Garage {
    id: string;
    name: string;
    address: string;
    phone: string;
    upiId: string;
    gstNumber?: string;
    logoUrl?: string;
    taxRate: number; // flat GST percent applied to every invoice, e.g. 18
    createdAt: string;
}
