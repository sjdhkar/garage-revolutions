export interface Customer {
    mobile: string; // Primary Key
    name: string;
    bikeNumber: string;
    bikeModel: string;
    allowWhatsApp: boolean;
}

export type JobStatus = 'RECEIVED' | 'IN_PROGRESS' | 'WAITING_PARTS' | 'COMPLETED' | 'DELIVERED';

export interface JobCardPart {
    itemId: string;
    name: string;
    quantity: number;
    price: number;
}

export interface JobCard {
    id: string; // auto-generated
    customerMobile: string;
    complaint: string;
    services: { description: string; cost: number }[]; // List of services with cost
    parts: JobCardPart[];
    status: JobStatus;
    totalAmount: number;
    serviceCost: number; // Regular service amount
    labourCost: number; // Labour amount
    paymentStatus?: 'PAID' | 'PENDING';
    paymentMode?: 'CASH' | 'UPI';
    createdAt: string; // ISO date
    updatedAt: string;
}

export type InventoryCategory = 'Oil' | 'Spare' | 'Consumable';

export interface InventoryItem {
    id: string;
    name: string;
    category: InventoryCategory;
    quantity: number;
    minStock: number;
    price: number;
}
