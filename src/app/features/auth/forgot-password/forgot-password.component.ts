import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-forgot-password',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    template: `
    <div class="auth-wrapper">
        <div class="auth-card">
            <div class="auth-logo">
                <div class="logo-icon">🔑</div>
                <h1>Reset Password</h1>
                <p>We'll send you a reset link</p>
            </div>

            @if (errorMessage()) {
                <div class="alert alert-danger">{{ errorMessage() }}</div>
            }
            @if (successMessage()) {
                <div class="alert alert-success">
                    <strong>Email sent!</strong> Check your inbox for the password reset link.
                </div>
            }

            @if (!successMessage()) {
                <form (ngSubmit)="onSubmit()">
                    <div class="form-group">
                        <label>Email Address</label>
                        <input type="email" class="form-control" placeholder="you@example.com"
                            [(ngModel)]="email" name="email" required />
                    </div>
                    <button type="submit" class="btn btn-primary" [disabled]="isLoading()">
                        @if (isLoading()) { <span class="spinner"></span> Sending... }
                        @else { Send Reset Link }
                    </button>
                </form>
            }

            <p class="auth-footer">
                Remember your password? <a routerLink="/auth/login">Sign in</a>
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
        .form-group { margin-bottom: 1.5rem; }
        .form-group label { display: block; color: var(--text-secondary, #71717a); font-size: 0.875rem; margin-bottom: 0.4rem; font-weight: 500; }
        .form-control { width: 100%; background: var(--surface, #fff); border: 1px solid var(--border-strong, #d4d4d8); border-radius: var(--radius-sm, 6px); padding: 0.75rem 1rem; color: var(--text-primary, #18181b); font-size: 0.95rem; transition: all 0.15s; box-sizing: border-box; }
        .form-control:focus { outline: none; border-color: var(--accent-500, #6366f1); box-shadow: 0 0 0 3px var(--accent-100, #e0e7ff); }
        .form-control::placeholder { color: var(--gray-400, #a1a1aa); }
        .btn { width: 100%; padding: 0.7rem; border-radius: var(--radius-sm, 6px); border: none; font-size: 0.95rem; font-weight: 600; cursor: pointer; transition: all 0.15s; display: flex; align-items: center; justify-content: center; gap: 0.5rem; }
        .btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-primary { background: var(--accent-500, #6366f1); color: #fff; }
        .btn-primary:hover:not(:disabled) { background: var(--accent-600, #4f46e5); }
        .auth-footer { text-align: center; color: var(--text-secondary, #71717a); font-size: 0.875rem; margin-top: 1.5rem; margin-bottom: 0; }
        .auth-footer a { color: var(--accent-600, #4f46e5); text-decoration: none; font-weight: 600; }
        .spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.4); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
    `]
})
export class ForgotPasswordComponent {
    private authService = inject(AuthService);
    email = '';
    isLoading = signal(false);
    errorMessage = signal('');
    successMessage = signal('');

    async onSubmit() {
        this.errorMessage.set('');
        this.isLoading.set(true);
        try {
            await this.authService.forgotPassword(this.email);
            this.successMessage.set('done');
        } catch (err: any) {
            const map: Record<string, string> = {
                'auth/user-not-found': 'No account found with this email address.',
                'auth/invalid-email': 'Invalid email address.',
            };
            this.errorMessage.set(map[err.code] ?? 'Failed to send reset email. Please try again.');
        } finally {
            this.isLoading.set(false);
        }
    }
}
