import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

// Regression test for the profile-creation race fixed earlier: onAuthStateChanged
// can fire (and, before the fix, resolve the caller's promise with `null`) before
// createUserProfile's own setDoc has finished writing the new user's doc. The fix
// centralizes fetch+create+set into the single onAuthStateChanged handler and has
// registerWithEmail/loginWithGoogle await a resolver registered *before* the
// Firebase call, so this can never race regardless of firing order.

let authStateCallback: ((user: any) => void) | null = null;
let firestoreDocs: Record<string, any> = {};

vi.mock('firebase/auth', () => ({
    onAuthStateChanged: (_auth: any, cb: any) => {
        authStateCallback = cb;
        return () => { authStateCallback = null; };
    },
    signInWithEmailAndPassword: vi.fn(),
    createUserWithEmailAndPassword: vi.fn(async () => {
        const user = { uid: 'new-user-uid', email: 'new@example.com', emailVerified: false, displayName: null, photoURL: null };
        // Simulate the real SDK: the auth-state listener can fire in the same
        // microtask window as this promise resolving, i.e. before our own
        // `await createUserWithEmailAndPassword(...)` line even returns control
        // to registerWithEmail's caller code.
        queueMicrotask(() => authStateCallback?.(user));
        return { user };
    }),
    signInWithPopup: vi.fn(),
    GoogleAuthProvider: vi.fn(),
    signOut: vi.fn(async () => { }),
    sendPasswordResetEmail: vi.fn(),
    updateProfile: vi.fn(async () => { }),
}));

vi.mock('firebase/firestore', () => ({
    doc: (_db: any, ...path: string[]) => ({ path: path.join('/') }),
    setDoc: vi.fn(async (ref: any, data: any) => { firestoreDocs[ref.path] = data; }),
    getDoc: vi.fn(async (ref: any) => ({
        exists: () => ref.path in firestoreDocs,
        data: () => firestoreDocs[ref.path],
    })),
}));

vi.mock('../configs/firebase.config', () => ({
    auth: {},
    db: {},
}));

import { AuthService } from './auth.service';
import { GarageService } from './garage.service';

describe('AuthService registration race', () => {
    beforeEach(() => {
        firestoreDocs = {};
        authStateCallback = null;
        TestBed.configureTestingModule({
            providers: [
                provideRouter([]),
                // TestBed provider override, rather than vi.mock('./garage.service', ...):
                // module-level mocks can lose their timing race against another spec
                // file's earlier import of the same module within the same worker,
                // leaving the real GarageService (and its real Firestore calls) in
                // place. A DI override always wins regardless of import order.
                { provide: GarageService, useValue: { ensureGarageExists: vi.fn(async () => { }) } },
            ],
        });
    });

    it('resolves registerWithEmail with the newly-created profile, even though onAuthStateChanged fires before the profile write is (visibly) queued', async () => {
        const service = TestBed.inject(AuthService);

        await service.registerWithEmail('New User', 'new@example.com', 'password123');

        const profile = service.currentUser();
        expect(profile).toBeTruthy();
        expect(profile?.id).toBe('new-user-uid');
        expect(profile?.name).toBe('New User');
        expect(profile?.role).toBe('owner');
        expect(profile?.status).toBe('active');
    });

    it('never leaves currentUser as null after a successful registration (the original bug)', async () => {
        const service = TestBed.inject(AuthService);
        await service.registerWithEmail('Another User', 'another@example.com', 'password123');
        expect(service.currentUser()).not.toBeNull();
    });
});
