import { Injectable, signal, computed } from '@angular/core';
import { AppUser } from '../models/user.model';
import { db } from '../configs/firebase.config';
import { DEFAULT_GARAGE_ID } from '../configs/garage.constants';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

@Injectable({ providedIn: 'root' })
export class TeamService {
    readonly members = signal<AppUser[]>([]);
    readonly technicians = computed(() => this.members().filter(m => m.role === 'technician' && m.status === 'active'));

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
    }

    getMember(uid: string): AppUser | undefined {
        return this.members().find(m => m.id === uid);
    }
}
