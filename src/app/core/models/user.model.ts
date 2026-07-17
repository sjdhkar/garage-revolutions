export type UserRole =
    | 'super_admin'
    | 'owner'
    | 'manager'
    | 'service_advisor'
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
    role: UserRole;
    status: UserStatus;
    emailVerified: boolean;
    createdAt: string;
    updatedAt: string;
    lastLogin: string;
}
