import { Injectable, inject } from '@angular/core';
import { ActivityLog } from '../models/activity-log.model';
import { db } from '../configs/firebase.config';
import { DEFAULT_GARAGE_ID } from '../configs/garage.constants';
import { AuthService } from './auth.service';
import { collection, doc, setDoc } from 'firebase/firestore';

@Injectable({ providedIn: 'root' })
export class LoggingService {
    private authService = inject(AuthService);

    /** Records an error to Firestore (best-effort) in addition to the console,
     * so a garage owner/operator has somewhere durable to look besides a
     * browser console that closes with the tab. Never throws — a logging
     * failure must not compound the error it's trying to record. */
    logError(context: string, error: unknown): void {
        const message = error instanceof Error ? error.message : String(error);
        const stack = error instanceof Error ? error.stack : undefined;
        console.error(`[${context}]`, error);
        this.writeLog('error', message, context, stack);
    }

    logAction(action: string, message: string): void {
        this.writeLog(action, message);
    }

    private writeLog(action: string, message: string, context?: string, stack?: string): void {
        try {
            const docRef = doc(collection(db!, 'activityLogs'));
            const entry: ActivityLog = {
                id: docRef.id,
                garageId: DEFAULT_GARAGE_ID,
                uid: this.authService.currentUser()?.id ?? 'anonymous',
                action,
                message,
                timestamp: new Date().toISOString(),
                ...(context ? { context } : {}),
                ...(stack ? { stack } : {}),
            };
            setDoc(docRef, entry).catch(() => { /* logging must never throw */ });
        } catch {
            // db unavailable, or called before auth/garage context exists — swallow.
        }
    }
}
