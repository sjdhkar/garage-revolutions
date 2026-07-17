import { Injectable, signal, computed, inject, effect } from '@angular/core';
import { JobCard, JobStatus, StatusHistoryEntry } from '../models/app.models';
import { db } from '../configs/firebase.config';
import { DEFAULT_GARAGE_ID } from '../configs/garage.constants';
import { AuthService } from './auth.service';
import { LoggingService } from './logging.service';
import { todayLocalDateString, isoTimestampToLocalDateString } from '../utils/date-utils';
import { collection, query, where, onSnapshot, doc, setDoc, updateDoc, orderBy, getDocs, deleteField } from 'firebase/firestore';

@Injectable({
    providedIn: 'root'
})
export class JobCardService {
    private authService = inject(AuthService);
    private loggingService = inject(LoggingService);

    readonly jobCards = signal<JobCard[]>([]);

    readonly activeJobs = computed(() =>
        this.jobCards().filter(j => j.status !== 'DELIVERED')
    );

    readonly todayJobs = computed(() => {
        const today = todayLocalDateString();
        return this.jobCards().filter(j => isoTimestampToLocalDateString(j.createdAt) === today);
    });

    constructor() {
        // A technician only ever sees job cards assigned to them (mirrors the
        // Firestore rule); every other active role sees the whole garage's job
        // cards. Re-subscribes whenever the signed-in user (or their role)
        // changes, tearing down the previous listener first.
        effect((onCleanup) => {
            const user = this.authService.currentUser();
            if (!user) {
                this.jobCards.set([]);
                return;
            }

            const constraints = [where('garageId', '==', DEFAULT_GARAGE_ID)];
            if (user.role === 'technician') {
                constraints.push(where('assignedTechnicianId', '==', user.id));
            }
            const jobCardsQuery = query(collection(db!, 'jobCards'), ...constraints);

            const unsubscribe = onSnapshot(jobCardsQuery, (snapshot) => {
                const list: JobCard[] = [];
                snapshot.forEach((d) => {
                    const j = d.data() as JobCard;
                    // Migration: handle old string[] services format
                    if (j.services?.length > 0 && typeof j.services[0] === 'string') {
                        list.push({
                            ...j,
                            services: (j.services as any as string[]).map(s => ({ description: s, cost: 0 }))
                        });
                    } else {
                        list.push(j);
                    }
                });
                list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                this.jobCards.set(list);
            }, (error) => {
                this.loggingService.logError('job-card.service:onSnapshot', error);
            });

            onCleanup(() => unsubscribe());
        });
    }

    async createJobCard(job: Omit<JobCard, 'id' | 'garageId' | 'createdAt' | 'updatedAt'>): Promise<string> {
        const docRef = doc(collection(db!, 'jobCards'));
        const newJob: JobCard = {
            ...job,
            id: docRef.id,
            garageId: DEFAULT_GARAGE_ID,
            status: 'RECEIVED',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        await setDoc(docRef, newJob);
        return newJob.id;
    }

    async updateStatus(id: string, status: JobStatus): Promise<void> {
        const fromStatus = this.getJobCard(id)?.status ?? null;
        const docRef = doc(db!, 'jobCards', id);
        await updateDoc(docRef, { status, updatedAt: new Date().toISOString() });

        const historyRef = doc(collection(db!, 'jobCards', id, 'statusHistory'));
        const entry: StatusHistoryEntry = {
            id: historyRef.id,
            fromStatus,
            toStatus: status,
            changedBy: this.authService.currentUser()?.id ?? 'unknown',
            changedAt: new Date().toISOString(),
        };
        await setDoc(historyRef, entry);
    }

    async getStatusHistory(jobId: string): Promise<StatusHistoryEntry[]> {
        const historyQuery = query(collection(db!, 'jobCards', jobId, 'statusHistory'), orderBy('changedAt', 'desc'));
        const snap = await getDocs(historyQuery);
        return snap.docs.map(d => d.data() as StatusHistoryEntry);
    }

    async updateJob(id: string, updates: Partial<JobCard>): Promise<void> {
        const docRef = doc(db!, 'jobCards', id);
        await updateDoc(docRef, { ...updates, updatedAt: new Date().toISOString() });
    }

    async assignTechnician(id: string, technicianId: string): Promise<void> {
        const docRef = doc(db!, 'jobCards', id);
        // Firestore rejects `undefined`; clearing the assignment (technicianId === '')
        // needs the deleteField() sentinel instead, not an undefined value.
        await updateDoc(docRef, {
            assignedTechnicianId: technicianId ? technicianId : deleteField(),
            updatedAt: new Date().toISOString(),
        });
    }

    getJobCard(id: string): JobCard | undefined {
        return this.jobCards().find(j => j.id === id);
    }
}
