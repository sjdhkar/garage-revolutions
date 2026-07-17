import { Injectable, signal, computed } from '@angular/core';
import { ServiceCatalogItem } from '../models/app.models';
import { db } from '../configs/firebase.config';
import { DEFAULT_GARAGE_ID } from '../configs/garage.constants';
import { collection, query, where, onSnapshot, doc, setDoc, updateDoc } from 'firebase/firestore';

@Injectable({ providedIn: 'root' })
export class ServiceCatalogService {
    readonly services = signal<ServiceCatalogItem[]>([]);
    readonly activeServices = computed(() => this.services().filter(s => s.active));

    constructor() {
        const servicesQuery = query(
            collection(db!, 'serviceCatalog'),
            where('garageId', '==', DEFAULT_GARAGE_ID)
        );
        onSnapshot(servicesQuery, (snapshot) => {
            const list: ServiceCatalogItem[] = [];
            snapshot.forEach((d) => list.push(d.data() as ServiceCatalogItem));
            this.services.set(list);
        }, (error) => {
            console.error('Firestore serviceCatalog read error:', error);
        });
    }

    getService(id: string): ServiceCatalogItem | undefined {
        return this.services().find(s => s.id === id);
    }

    async addService(service: Omit<ServiceCatalogItem, 'id' | 'garageId' | 'active'>): Promise<void> {
        const docRef = doc(collection(db!, 'serviceCatalog'));
        await setDoc(docRef, { ...service, id: docRef.id, garageId: DEFAULT_GARAGE_ID, active: true });
    }

    async updateService(id: string, updates: Partial<Omit<ServiceCatalogItem, 'id' | 'garageId'>>): Promise<void> {
        await updateDoc(doc(db!, 'serviceCatalog', id), updates);
    }

    async setActive(id: string, active: boolean): Promise<void> {
        await updateDoc(doc(db!, 'serviceCatalog', id), { active });
    }
}
