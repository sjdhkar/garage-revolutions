import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    sendPasswordResetEmail,
    onAuthStateChanged,
    updateProfile,
    User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../configs/firebase.config';
import { AppUser } from '../models/user.model';
import { GarageService } from './garage.service';
import { DEFAULT_GARAGE_ID } from '../configs/garage.constants';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private router = inject(Router);
    private garageService = inject(GarageService);

    readonly currentUser = signal<AppUser | null | undefined>(undefined); // undefined = loading
    readonly isLoading = computed(() => this.currentUser() === undefined);
    readonly isAuthenticated = computed(() => {
        const user = this.currentUser();
        return user !== undefined && user !== null;
    });

    // Set just before a sign-up/sign-in call that may need to create a brand-new
    // profile doc. Read only inside the single onAuthStateChanged handler below,
    // so profile fetch+create+set for a given auth event never runs more than once
    // (avoids a create/read race that would otherwise clobber currentUser with null).
    private pendingRegistration: { name: string; provider: 'email' | 'google' } | null = null;

    // A login/register call registers its resolver here *before* triggering the
    // Firebase call, so the onAuthStateChanged handler — which can fire and settle
    // before the caller's own await chain resumes — always has someone to notify.
    private pendingResolve: ((profile: AppUser | null) => void) | null = null;
    private pendingReject: ((err: Error) => void) | null = null;

    constructor() {
        onAuthStateChanged(auth!, async (firebaseUser) => {
            if (!firebaseUser) {
                this.currentUser.set(null);
                return;
            }

            try {
                let profile = await this.fetchUserProfile(firebaseUser.uid);

                if (!profile && this.pendingRegistration) {
                    const { provider, name } = this.pendingRegistration;
                    this.pendingRegistration = null;
                    profile = await this.createUserProfile(
                        firebaseUser,
                        provider === 'google' ? (firebaseUser.displayName ?? 'User') : name,
                        provider
                    );
                } else if (profile) {
                    this.updateLastLogin(firebaseUser.uid);
                }

                if (profile && profile.status !== 'active') {
                    await signOut(auth!);
                    this.currentUser.set(null);
                    this.settlePending(null);
                    this.router.navigate(['/auth/login'], { queryParams: { error: profile.status } });
                    return;
                }

                this.currentUser.set(profile);
                this.settlePending(profile);
                this.garageService.ensureGarageExists();
            } catch (e) {
                this.currentUser.set(null);
                this.settlePendingError(e as Error);
            }
        });
    }

    async loginWithEmail(email: string, password: string): Promise<void> {
        const waitForProfile = this.registerPendingWait();
        try {
            await signInWithEmailAndPassword(auth!, email, password);
        } catch (err) {
            this.clearPendingWait();
            throw err;
        }
        await waitForProfile;
    }

    async registerWithEmail(name: string, email: string, password: string): Promise<void> {
        this.pendingRegistration = { name, provider: 'email' };
        const waitForProfile = this.registerPendingWait();
        try {
            const cred = await createUserWithEmailAndPassword(auth!, email, password);
            await updateProfile(cred.user, { displayName: name });
        } catch (err) {
            this.pendingRegistration = null;
            this.clearPendingWait();
            throw err;
        }
        await waitForProfile;
    }

    async loginWithGoogle(): Promise<void> {
        this.pendingRegistration = { name: '', provider: 'google' };
        const waitForProfile = this.registerPendingWait();
        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth!, provider);
        } catch (err) {
            this.pendingRegistration = null;
            this.clearPendingWait();
            throw err;
        }
        await waitForProfile;
    }

    async logout(): Promise<void> {
        await signOut(auth!);
        this.currentUser.set(null);
        this.router.navigate(['/auth/login']);
    }

    async forgotPassword(email: string): Promise<void> {
        await sendPasswordResetEmail(auth!, email);
    }

    private settlePending(profile: AppUser | null) {
        if (this.pendingResolve) {
            this.pendingResolve(profile);
            this.clearPendingWait();
        }
    }

    private settlePendingError(err: Error) {
        if (this.pendingReject) {
            this.pendingReject(err);
            this.clearPendingWait();
        }
    }

    private clearPendingWait() {
        this.pendingResolve = null;
        this.pendingReject = null;
    }

    private registerPendingWait(): Promise<AppUser> {
        return new Promise((resolve, reject) => {
            this.pendingResolve = (profile) => {
                if (profile) resolve(profile);
                else reject(new Error('auth/profile-not-found'));
            };
            this.pendingReject = reject;
            setTimeout(() => {
                if (this.pendingReject === reject) {
                    this.clearPendingWait();
                    reject(new Error('auth/profile-timeout'));
                }
            }, 15000);
        });
    }

    private async createUserProfile(
        firebaseUser: FirebaseUser,
        name: string,
        provider: 'email' | 'google'
    ): Promise<AppUser> {
        const now = new Date().toISOString();
        const profile: AppUser = {
            id: firebaseUser.uid,
            name,
            email: firebaseUser.email ?? '',
            provider,
            garageId: DEFAULT_GARAGE_ID,
            role: 'owner',
            status: 'active',
            emailVerified: firebaseUser.emailVerified,
            createdAt: now,
            updatedAt: now,
            lastLogin: now,
        };
        if (provider === 'google') profile.googleId = firebaseUser.uid;
        if (firebaseUser.photoURL) profile.profileImage = firebaseUser.photoURL;
        await setDoc(doc(db!, 'users', firebaseUser.uid), profile);
        return profile;
    }

    private async updateLastLogin(uid: string): Promise<void> {
        try {
            await setDoc(
                doc(db!, 'users', uid),
                { lastLogin: new Date().toISOString(), updatedAt: new Date().toISOString() },
                { merge: true }
            );
        } catch (e) {
            console.error('Failed to update last login:', e);
        }
    }

    private async fetchUserProfile(uid: string): Promise<AppUser | null> {
        try {
            const snap = await getDoc(doc(db!, 'users', uid));
            return snap.exists() ? (snap.data() as AppUser) : null;
        } catch (e) {
            console.error('Failed to fetch user profile:', e);
            return null;
        }
    }
}
