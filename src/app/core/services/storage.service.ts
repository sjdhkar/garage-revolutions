import { Injectable } from '@angular/core';
import { storage } from '../configs/firebase.config';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

@Injectable({ providedIn: 'root' })
export class StorageService {
    async uploadFile(path: string, file: File): Promise<string> {
        const fileRef = ref(storage!, path);
        await uploadBytes(fileRef, file);
        return getDownloadURL(fileRef);
    }

    async deleteFile(path: string): Promise<void> {
        const fileRef = ref(storage!, path);
        await deleteObject(fileRef);
    }
}
