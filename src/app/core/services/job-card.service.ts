import { Injectable, signal, computed } from '@angular/core';
import { JobCard, JobStatus } from '../models/app.models';
import { db } from '../configs/firebase.config';
import { collection, onSnapshot, doc, setDoc, updateDoc } from 'firebase/firestore';

@Injectable({
    providedIn: 'root'
})
export class JobCardService {
    readonly jobCards = signal<JobCard[]>([]);

    readonly activeJobs = computed(() =>
        this.jobCards().filter(j => j.status !== 'DELIVERED')
    );

    readonly todayJobs = computed(() => {
        const today = new Date().toISOString().split('T')[0];
        return this.jobCards().filter(j => j.createdAt.startsWith(today));
    });

    constructor() {
        const jobCardsRef = collection(db!, 'job-cards');
        onSnapshot(jobCardsRef, (snapshot) => {
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
            console.error("Firestore job cards read error:", error);
        });
    }

    createJobCard(job: Omit<JobCard, 'id' | 'createdAt' | 'updatedAt' | 'totalAmount'>): void {
        const newJob: JobCard = {
            ...job,
            id: this.generateJobId(),
            status: 'RECEIVED',
            totalAmount: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        const docRef = doc(db!, 'job-cards', newJob.id);
        setDoc(docRef, newJob).catch(err => console.error("Error creating job card:", err));
    }

    updateStatus(id: string, status: JobStatus): void {
        const docRef = doc(db!, 'job-cards', id);
        updateDoc(docRef, { status, updatedAt: new Date().toISOString() })
            .catch(err => console.error("Error updating job card status:", err));
    }

    updateJob(id: string, updates: Partial<JobCard>): void {
        const docRef = doc(db!, 'job-cards', id);
        updateDoc(docRef, { ...updates, updatedAt: new Date().toISOString() })
            .catch(err => console.error("Error updating job card:", err));
    }

    getJobCard(id: string): JobCard | undefined {
        return this.jobCards().find(j => j.id === id);
    }

    private generateJobId(): string {
        return 'JC-' + Math.floor(1000 + Math.random() * 9000);
    }
}
