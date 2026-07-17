export type UserRole =
    | 'super_admin'
    | 'owner'
    | 'admin'
    | 'receptionist'
    | 'technician'
    | 'accountant';

export type UserStatus = 'active' | 'suspended' | 'disabled';
export type LoginProvider = 'google' | 'email';

export interface AppUser {
    id: string;
    name: string;
    email: string;
    phone?: string;
    provider: LoginProvider;
    googleId?: string;
    profileImage?: string;
    garageId: string;
    role: UserRole;
    status: UserStatus;
    emailVerified: boolean;
    createdAt: string;
    updatedAt: string;
    lastLogin: string;
}
