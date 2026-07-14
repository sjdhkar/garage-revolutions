import { Injectable, signal, effect, computed } from '@angular/core';
import { JobCard, JobStatus } from '../models/app.models';
import { db, isFirebaseConfigured } from '../configs/firebase.config';
import { collection, onSnapshot, doc, setDoc, updateDoc } from 'firebase/firestore';

@Injectable({
    providedIn: 'root'
})
export class JobCardService {
    readonly jobCards = signal<JobCard[]>([]);
    private unsubscribeFirestore?: () => void;
    private isUsingFallback = false;

    readonly activeJobs = computed(() =>
        this.jobCards().filter(j => j.status !== 'DELIVERED')
    );

    readonly todayJobs = computed(() => {
        const today = new Date().toISOString().split('T')[0];
        return this.jobCards().filter(j => j.createdAt.startsWith(today));
    });

    constructor() {
        this.initializeData();
    }

    private initializeData() {
        if (isFirebaseConfigured && db) {
            const jobCardsRef = collection(db, 'job-cards');
            this.unsubscribeFirestore = onSnapshot(jobCardsRef, (snapshot) => {
                const list: JobCard[] = [];
                snapshot.forEach((docVal) => {
                    const j = docVal.data() as JobCard;
                    if (j.services && j.services.length > 0 && typeof j.services[0] === 'string') {
                        list.push({
                            ...j,
                            services: (j.services as any as string[]).map(s => ({ description: s, cost: 0 }))
                        });
                    } else {
                        list.push(j);
                    }
                });
                // Sort by createdAt descending (newest first)
                list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                this.jobCards.set(list);
                this.isUsingFallback = false;
            }, (error) => {
                console.error("Firestore job cards read error (falling back to LocalStorage):", error);
                this.activateFallback();
            });
        } else {
            this.activateFallback();
        }
    }

    private activateFallback() {
        this.isUsingFallback = true;
        this.jobCards.set(this.loadJobCards());
        try {
            effect(() => {
                if (this.isUsingFallback) {
                    this.saveJobCards(this.jobCards());
                }
            });
        } catch (e) {
            // Safe catch if called outside injection context
        }
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
        if (isFirebaseConfigured && db && !this.isUsingFallback) {
            const docRef = doc(db, 'job-cards', newJob.id);
            setDoc(docRef, newJob).catch(err => {
                console.error("Error creating job card (falling back to LocalStorage):", err);
                this.isUsingFallback = true;
                this.jobCards.update(list => [newJob, ...list]);
                this.saveJobCards(this.jobCards());
            });
        } else {
            this.jobCards.update(list => [newJob, ...list]);
            if (this.isUsingFallback) this.saveJobCards(this.jobCards());
        }
    }

    updateStatus(id: string, status: JobStatus): void {
        if (isFirebaseConfigured && db && !this.isUsingFallback) {
            const docRef = doc(db, 'job-cards', id);
            updateDoc(docRef, { status, updatedAt: new Date().toISOString() }).catch(err => {
                console.error("Error updating status (falling back to LocalStorage):", err);
                this.isUsingFallback = true;
                this.jobCards.update(list =>
                    list.map(j => j.id === id ? { ...j, status, updatedAt: new Date().toISOString() } : j)
                );
                this.saveJobCards(this.jobCards());
            });
        } else {
            this.jobCards.update(list =>
                list.map(j => j.id === id ? { ...j, status, updatedAt: new Date().toISOString() } : j)
            );
            if (this.isUsingFallback) this.saveJobCards(this.jobCards());
        }
    }

    updateJob(id: string, updates: Partial<JobCard>): void {
        const timestamped = {
            ...updates,
            updatedAt: new Date().toISOString()
        };
        if (isFirebaseConfigured && db && !this.isUsingFallback) {
            const docRef = doc(db, 'job-cards', id);
            updateDoc(docRef, timestamped).catch(err => {
                console.error("Error updating job card (falling back to LocalStorage):", err);
                this.isUsingFallback = true;
                this.jobCards.update(list =>
                    list.map(j => j.id === id ? { ...j, ...timestamped } : j)
                );
                this.saveJobCards(this.jobCards());
            });
        } else {
            this.jobCards.update(list =>
                list.map(j => j.id === id ? { ...j, ...timestamped } : j)
            );
            if (this.isUsingFallback) this.saveJobCards(this.jobCards());
        }
    }

    getJobCard(id: string): JobCard | undefined {
        return this.jobCards().find(j => j.id === id);
    }

    private generateJobId(): string {
        return 'JC-' + Math.floor(1000 + Math.random() * 9000);
    }

    private loadJobCards(): JobCard[] {
        const data = localStorage.getItem('garage_job_cards');
        if (!data) return [];

        const jobs: JobCard[] = JSON.parse(data);

        // Migration: Convert old string[] services to object[]
        return jobs.map(j => {
            if (j.services && j.services.length > 0 && typeof j.services[0] === 'string') {
                return {
                    ...j,
                    services: (j.services as any as string[]).map(s => ({ description: s, cost: 0 }))
                };
            }
            return j;
        });
    }

    private saveJobCards(jobs: JobCard[]): void {
        localStorage.setItem('garage_job_cards', JSON.stringify(jobs));
    }
}
