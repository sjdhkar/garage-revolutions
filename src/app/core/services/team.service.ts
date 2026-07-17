import { Injectable, signal, computed } from '@angular/core';
import { AppUser, UserRole, UserStatus } from '../models/user.model';
import { StaffInvite } from '../models/staff-invite.model';
import { db } from '../configs/firebase.config';
import { DEFAULT_GARAGE_ID } from '../configs/garage.constants';
import { collection, query, where, onSnapshot, doc, setDoc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';

@Injectable({ providedIn: 'root' })
export class TeamService {
    readonly members = signal<AppUser[]>([]);
    readonly technicians = computed(() => this.members().filter(m => m.role === 'technician' && m.status === 'active'));
    readonly invites = signal<StaffInvite[]>([]);

    constructor() {
        const membersQuery = query(
            collection(db!, 'users'),
            where('garageId', '==', DEFAULT_GARAGE_ID)
        );
        onSnapshot(membersQuery, (snapshot) => {
            const list: AppUser[] = [];
            snapshot.forEach((d) => list.push(d.data() as AppUser));
            this.members.set(list);
        }, (error) => {
            console.error('Firestore team members read error:', error);
        });

        const invitesQuery = collection(db!, 'garages', DEFAULT_GARAGE_ID, 'staffInvites');
        onSnapshot(invitesQuery, (snapshot) => {
            const list: StaffInvite[] = [];
            snapshot.forEach((d) => list.push(d.data() as StaffInvite));
            this.invites.set(list);
        }, (error) => {
            console.error('Firestore staff invites read error:', error);
        });
    }

    getMember(uid: string): AppUser | undefined {
        return this.members().find(m => m.id === uid);
    }

    async updateMemberRole(uid: string, role: UserRole): Promise<void> {
        await updateDoc(doc(db!, 'users', uid), { role, updatedAt: new Date().toISOString() });
    }

    async updateMemberStatus(uid: string, status: UserStatus): Promise<void> {
        await updateDoc(doc(db!, 'users', uid), { status, updatedAt: new Date().toISOString() });
    }

    async createInvite(email: string, role: UserRole, invitedBy: string): Promise<void> {
        const normalizedEmail = email.trim().toLowerCase();
        const invite: StaffInvite = {
            id: normalizedEmail,
            email: normalizedEmail,
            role,
            invitedBy,
            createdAt: new Date().toISOString(),
        };
        await setDoc(doc(db!, 'garages', DEFAULT_GARAGE_ID, 'staffInvites', normalizedEmail), invite);
    }

    listInvites(): StaffInvite[] {
        return this.invites();
    }

    async deleteInvite(id: string): Promise<void> {
        await deleteDoc(doc(db!, 'garages', DEFAULT_GARAGE_ID, 'staffInvites', id));
    }

    /**
     * A direct doc `get` by the invite's email-as-ID — not a query — since the
     * firestore.rules carve-out only grants `allow get`, not `allow list`, to a
     * caller who has no profile doc yet (see the `staffInvites` rule comment).
     */
    async findInviteByEmail(email: string): Promise<StaffInvite | null> {
        const normalizedEmail = email.trim().toLowerCase();
        const snap = await getDoc(doc(db!, 'garages', DEFAULT_GARAGE_ID, 'staffInvites', normalizedEmail));
        return snap.exists() ? (snap.data() as StaffInvite) : null;
    }
}
