import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    template: `
    <div class="auth-wrapper">
        <div class="auth-card">
            <div class="auth-logo">
                <div class="logo-icon">🔧</div>
                <h1>Create Account</h1>
                <p>Join Revolution Moto Garage</p>
            </div>

            @if (errorMessage()) {
                <div class="alert alert-danger">{{ errorMessage() }}</div>
            }
            @if (successMessage()) {
                <div class="alert alert-success">{{ successMessage() }}</div>
            }

            <form (ngSubmit)="onRegister()" #regForm="ngForm">
                <div class="form-group">
                    <label>Full Name</label>
                    <input type="text" class="form-control" placeholder="Your full name"
                        [(ngModel)]="name" name="name" required />
                </div>
                <div class="form-group">
                    <label>Email Address</label>
                    <input type="email" class="form-control" placeholder="you@example.com"
                        [(ngModel)]="email" name="email" required />
                </div>
                <div class="form-group">
                    <label>Password</label>
                    <div class="input-with-action">
                        <input [type]="showPassword() ? 'text' : 'password'"
                            class="form-control" placeholder="Min. 6 characters"
                            [(ngModel)]="password" name="password" required minlength="6" />
                        <button type="button" class="toggle-pw" (click)="toggleShowPassword()">
                            {{ showPassword() ? '🙈' : '👁️' }}
                        </button>
                    </div>
                </div>
                <div class="form-group">
                    <label>Confirm Password</label>
                    <input type="password" class="form-control" placeholder="Repeat password"
                        [(ngModel)]="confirmPassword" name="confirmPassword" required />
                </div>

                <button type="submit" class="btn btn-primary" [disabled]="isLoading()">
                    @if (isLoading()) { <span class="spinner"></span> Creating account... }
                    @else { Create Account }
                </button>
            </form>

            <div class="divider"><span>or</span></div>

            <button class="btn btn-google" (click)="onGoogleRegister()" [disabled]="isLoading()">
                <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign up with Google
            </button>

            <p class="auth-footer">
                Already have an account? <a routerLink="/auth/login">Sign in</a>
            </p>
        </div>
    </div>
    `,
    styles: [`
        .auth-wrapper {
            min-height: 100vh;
            background: var(--surface-sunken, #fafafa);
            display: flex; align-items: center; justify-content: center;
            padding: 2rem; font-family: var(--font-sans, 'Inter', system-ui, sans-serif);
        }
        .auth-card {
            background: var(--surface, #fff);
            border: 1px solid var(--border, #e4e4e7); border-radius: var(--radius-lg, 12px);
            padding: 2.5rem; width: 100%; max-width: 420px;
            box-shadow: var(--shadow-md, 0 2px 8px rgba(0,0,0,0.06));
        }
        .auth-logo { text-align: center; margin-bottom: 2rem; }
        .logo-icon { font-size: 2.5rem; display: block; margin-bottom: 0.5rem; }
        .auth-logo h1 { color: var(--text-primary, #18181b); font-size: 1.375rem; font-weight: 700; margin: 0 0 0.25rem; }
        .auth-logo p { color: var(--text-secondary, #71717a); font-size: 0.85rem; margin: 0; }
        .alert { border-radius: var(--radius-md, 8px); padding: 0.75rem 1rem; margin-bottom: 1rem; font-size: 0.875rem; }
        .alert-danger { background: var(--danger-100, #fee2e2); border: 1px solid var(--danger-500, #dc2626); color: var(--danger-500, #dc2626); }
        .alert-success { background: var(--success-100, #dcfce7); border: 1px solid var(--success-500, #16a34a); color: var(--success-500, #16a34a); }
        .form-group { margin-bottom: 1.1rem; }
        .form-group label { display: block; color: var(--text-secondary, #71717a); font-size: 0.875rem; margin-bottom: 0.4rem; font-weight: 500; }
        .form-control {
            width: 100%; background: var(--surface, #fff); border: 1px solid var(--border-strong, #d4d4d8);
            border-radius: var(--radius-sm, 6px); padding: 0.75rem 1rem; color: var(--text-primary, #18181b); font-size: 0.95rem;
            transition: all 0.15s; box-sizing: border-box;
        }
        .form-control:focus { outline: none; border-color: var(--accent-500, #6366f1); box-shadow: 0 0 0 3px var(--accent-100, #e0e7ff); }
        .form-control::placeholder { color: var(--gray-400, #a1a1aa); }
        .input-with-action { position: relative; }
        .input-with-action .form-control { padding-right: 3rem; }
        .toggle-pw { position: absolute; right: 0.75rem; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; font-size: 1rem; }
        .btn { width: 100%; padding: 0.7rem; border-radius: var(--radius-sm, 6px); border: none; font-size: 0.95rem; font-weight: 600; cursor: pointer; transition: all 0.15s; display: flex; align-items: center; justify-content: center; gap: 0.5rem; }
        .btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-primary { background: var(--accent-500, #6366f1); color: #fff; }
        .btn-primary:hover:not(:disabled) { background: var(--accent-600, #4f46e5); }
        .btn-google { background: var(--surface, #fff); color: var(--text-primary, #18181b); border: 1px solid var(--border-strong, #d4d4d8); }
        .btn-google:hover:not(:disabled) { background: var(--gray-100, #f4f4f5); }
        .divider { display: flex; align-items: center; gap: 1rem; margin: 1.25rem 0; color: var(--text-secondary, #a1a1aa); font-size: 0.8rem; }
        .divider::before, .divider::after { content: ''; flex: 1; height: 1px; background: var(--border, #e4e4e7); }
        .auth-footer { text-align: center; color: var(--text-secondary, #71717a); font-size: 0.875rem; margin-top: 1.5rem; margin-bottom: 0; }
        .auth-footer a { color: var(--accent-600, #4f46e5); text-decoration: none; font-weight: 600; }
        .spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.4); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
    `]
})
export class RegisterComponent {
    private authService = inject(AuthService);
    private router = inject(Router);

    name = '';
    email = '';
    password = '';
    confirmPassword = '';
    showPassword = signal(false);
    isLoading = signal(false);
    errorMessage = signal('');
    successMessage = signal('');

    toggleShowPassword() {
        this.showPassword.update(v => !v);
    }

    async onRegister() {
        this.errorMessage.set('');
        if (this.password !== this.confirmPassword) {
            this.errorMessage.set('Passwords do not match.');
            return;
        }
        this.isLoading.set(true);
        try {
            await this.authService.registerWithEmail(this.name, this.email, this.password);
            this.router.navigate(['/dashboard']);
        } catch (err: any) {
            this.errorMessage.set(this.friendlyError(err.code));
        } finally {
            this.isLoading.set(false);
        }
    }

    async onGoogleRegister() {
        this.errorMessage.set('');
        this.isLoading.set(true);
        try {
            await this.authService.loginWithGoogle();
            this.router.navigate(['/dashboard']);
        } catch (err: any) {
            this.errorMessage.set(this.friendlyError(err.code));
        } finally {
            this.isLoading.set(false);
        }
    }

    private friendlyError(code: string): string {
        const map: Record<string, string> = {
            'auth/email-already-in-use': 'An account with this email already exists.',
            'auth/weak-password': 'Password is too weak. Use at least 6 characters.',
            'auth/invalid-email': 'Invalid email address.',
            'auth/popup-closed-by-user': 'Google sign-up was cancelled.',
        };
        return map[code] ?? 'An error occurred. Please try again.';
    }
}
