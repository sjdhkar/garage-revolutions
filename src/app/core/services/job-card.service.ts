import { Injectable, signal, effect, computed } from '@angular/core';
import { JobCard, JobStatus } from '../models/app.models';

@Injectable({
    providedIn: 'root'
})
export class JobCardService {
    readonly jobCards = signal<JobCard[]>(this.loadJobCards());

    readonly activeJobs = computed(() =>
        this.jobCards().filter(j => j.status !== 'DELIVERED')
    );

    readonly todayJobs = computed(() => {
        const today = new Date().toISOString().split('T')[0];
        return this.jobCards().filter(j => j.createdAt.startsWith(today));
    });

    constructor() {
        effect(() => {
            this.saveJobCards(this.jobCards());
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
        this.jobCards.update(list => [newJob, ...list]);
    }

    updateStatus(id: string, status: JobStatus): void {
        this.jobCards.update(list =>
            list.map(j => j.id === id ? { ...j, status, updatedAt: new Date().toISOString() } : j)
        );
    }

    updateJob(id: string, updates: Partial<JobCard>): void {
        this.jobCards.update(list =>
            list.map(j => j.id === id ? { ...j, ...updates, updatedAt: new Date().toISOString() } : j)
        );
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
