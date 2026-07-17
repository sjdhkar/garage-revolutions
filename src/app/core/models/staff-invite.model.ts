import { UserRole } from './user.model';

export interface StaffInvite {
    id: string; // = the invited email address (see firestore.rules for why)
    email: string;
    role: UserRole;
    invitedBy: string; // uid of the owner/admin who created the invite
    createdAt: string;
}
