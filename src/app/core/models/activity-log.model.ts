export interface ActivityLog {
    id: string;
    garageId: string;
    uid: string;
    action: string; // e.g. 'error', 'job-card-created', 'invoice-issued'
    message: string;
    stack?: string;
    context?: string;
    timestamp: string; // ISO date
}
