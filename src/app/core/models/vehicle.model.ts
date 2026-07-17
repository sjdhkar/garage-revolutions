export interface Vehicle {
    id: string;
    garageId: string;
    customerId: string; // = the owning Customer's mobile number (existing join key convention)
    bikeNumber: string;
    bikeModel: string;
    color?: string;
    createdAt: string;
}
