export interface Customer {
    garageId: string;
    mobile: string; // Primary Key
    name: string;
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
    garageId: string;
    customerMobile: string;
    vehicleId: string;
    assignedTechnicianId?: string;
    complaint: string;
    internalNotes?: string; // staff-only, never shown to the customer (print/WhatsApp)
    services: { description: string; cost: number }[]; // List of services with cost
    parts: JobCardPart[];
    status: JobStatus;
    // Billing is now handled by the Invoice model (immutable snapshot + payment
    // ledger) generated from this job card — see invoice.service.ts. The old
    // totalAmount/serviceCost/labourCost/paymentStatus/paymentMode fields were
    // either dead (never read after creation) or superseded by that.
    createdAt: string; // ISO date
    updatedAt: string;
}

export type InventoryCategory = 'Oil' | 'Spare' | 'Consumable';

export interface Supplier {
    id: string;
    garageId: string;
    name: string;
    contact?: string;
    phone?: string;
    email?: string;
}

export interface InventoryItem {
    id: string;
    garageId: string;
    name: string;
    sku?: string;
    category: InventoryCategory;
    supplierId?: string;
    quantity: number;
    minStock: number;
    purchasePrice: number;
    sellingPrice: number;
    taxRate: number; // percent, e.g. 18 for 18% GST
    active: boolean;
}

export interface ServiceCatalogItem {
    id: string;
    garageId: string;
    name: string;
    category: string;
    standardPrice: number;
    estimatedMinutes: number;
    active: boolean;
}

export type StockMovementReason = 'sale' | 'restock' | 'adjustment';

export interface StockMovement {
    id: string;
    change: number; // positive = added, negative = removed
    reason: StockMovementReason;
    jobCardId?: string;
    changedBy: string; // uid
    changedAt: string; // ISO date
}

export interface StatusHistoryEntry {
    id: string;
    fromStatus: JobStatus | null;
    toStatus: JobStatus;
    changedBy: string; // uid
    changedAt: string; // ISO date
}
