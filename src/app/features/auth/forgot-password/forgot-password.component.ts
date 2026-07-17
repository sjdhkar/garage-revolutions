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
            background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%);
            display: flex; align-items: center; justify-content: center;
            padding: 2rem; font-family: 'Inter', system-ui, sans-serif;
        }
        .auth-card {
            background: rgba(255,255,255,0.05); backdrop-filter: blur(20px);
            border: 1px solid rgba(255,255,255,0.1); border-radius: 20px;
            padding: 2.5rem; width: 100%; max-width: 420px;
            box-shadow: 0 25px 50px rgba(0,0,0,0.5);
        }
        .auth-logo { text-align: center; margin-bottom: 2rem; }
        .logo-icon { font-size: 3rem; display: block; margin-bottom: 0.5rem; }
        .auth-logo h1 { color: #fff; font-size: 1.5rem; font-weight: 700; margin: 0 0 0.25rem; }
        .auth-logo p { color: rgba(255,255,255,0.5); font-size: 0.85rem; margin: 0; }
        .alert { border-radius: 10px; padding: 0.75rem 1rem; margin-bottom: 1rem; font-size: 0.875rem; }
        .alert-danger { background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3); color: #fca5a5; }
        .alert-success { background: rgba(34,197,94,0.15); border: 1px solid rgba(34,197,94,0.3); color: #86efac; }
        .form-group { margin-bottom: 1.5rem; }
        .form-group label { display: block; color: rgba(255,255,255,0.7); font-size: 0.875rem; margin-bottom: 0.4rem; font-weight: 500; }
        .form-control { width: 100%; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); border-radius: 10px; padding: 0.75rem 1rem; color: #fff; font-size: 0.95rem; transition: all 0.2s; box-sizing: border-box; }
        .form-control:focus { outline: none; border-color: #6366f1; background: rgba(99,102,241,0.1); box-shadow: 0 0 0 3px rgba(99,102,241,0.2); }
        .form-control::placeholder { color: rgba(255,255,255,0.3); }
        .btn { width: 100%; padding: 0.85rem; border-radius: 10px; border: none; font-size: 0.95rem; font-weight: 600; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 0.5rem; }
        .btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-primary { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; }
        .btn-primary:hover:not(:disabled) { background: linear-gradient(135deg, #4f46e5, #7c3aed); transform: translateY(-1px); box-shadow: 0 8px 25px rgba(99,102,241,0.4); }
        .auth-footer { text-align: center; color: rgba(255,255,255,0.5); font-size: 0.875rem; margin-top: 1.5rem; margin-bottom: 0; }
        .auth-footer a { color: #818cf8; text-decoration: none; font-weight: 600; }
        .spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; }
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
