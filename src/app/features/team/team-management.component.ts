import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TeamService } from '../../core/services/team.service';
import { AuthService } from '../../core/services/auth.service';
import { UserRole, UserStatus } from '../../core/models/user.model';
import { ToastService } from '../../shared/services/toast.service';

const ROLES: UserRole[] = ['owner', 'admin', 'receptionist', 'technician', 'accountant'];

@Component({
    selector: 'app-team-management',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    template: `
    <div class="row mb-4 align-items-center">
      <div class="col">
        <h2>Team <small class="text-muted">(टीम)</small></h2>
      </div>
      <div class="col-auto">
        <a routerLink="/dashboard" class="btn btn-outline-secondary">Back to Dashboard</a>
      </div>
    </div>

    @if (!canManage()) {
      <div class="alert alert-warning">Only an owner or admin can manage the team.</div>
    } @else {
      <div class="card mb-4">
        <div class="card-header">Members</div>
        <div class="card-body">
          <table class="table table-sm align-middle">
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th></tr></thead>
            <tbody>
              <tr *ngFor="let member of members()">
                <td>{{ member.name }}</td>
                <td>{{ member.email }}</td>
                <td>
                  <select class="form-select form-select-sm" [ngModel]="member.role"
                    (ngModelChange)="changeRole(member.id, $event)"
                    [disabled]="member.id === currentUserId()">
                    <option *ngFor="let role of roles" [value]="role">{{ role | titlecase }}</option>
                  </select>
                </td>
                <td>
                  <select class="form-select form-select-sm" [ngModel]="member.status"
                    (ngModelChange)="changeStatus(member.id, $event)"
                    [disabled]="member.id === currentUserId()">
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="card mb-4">
        <div class="card-header">Pending Invites</div>
        <div class="card-body">
          <ul class="list-group list-group-flush mb-3">
            <li class="list-group-item d-flex justify-content-between align-items-center" *ngFor="let invite of invites()">
              <span>{{ invite.email }} — <span class="text-muted">{{ invite.role | titlecase }}</span></span>
              <button class="btn btn-sm btn-outline-danger" (click)="cancelInvite(invite.id)">Cancel</button>
            </li>
            <li class="list-group-item text-muted" *ngIf="invites().length === 0">No pending invites.</li>
          </ul>

          <div class="row g-2 align-items-end">
            <div class="col-md-6">
              <label class="form-label">Email</label>
              <input type="email" class="form-control" [(ngModel)]="inviteEmail" placeholder="staff@example.com">
            </div>
            <div class="col-md-3">
              <label class="form-label">Role</label>
              <select class="form-select" [(ngModel)]="inviteRole">
                <option *ngFor="let role of invitableRoles" [value]="role">{{ role | titlecase }}</option>
              </select>
            </div>
            <div class="col-md-3">
              <button class="btn btn-primary w-100" [disabled]="!inviteEmail" (click)="sendInvite()">Invite</button>
            </div>
          </div>
          <small class="text-muted d-block mt-2">
            No email is sent — share the app link with them directly. When they register with this exact email, they'll be attached with the role chosen here instead of becoming an owner.
          </small>
        </div>
      </div>
    }
  `
})
export class TeamManagementComponent {
    private teamService = inject(TeamService);
    private authService = inject(AuthService);
    private toastService = inject(ToastService);

    roles = ROLES;
    invitableRoles: UserRole[] = ['admin', 'receptionist', 'technician', 'accountant'];

    members = this.teamService.members;
    invites = this.teamService.invites;

    currentUserId = computed(() => this.authService.currentUser()?.id);

    canManage = computed(() => {
        const role = this.authService.currentUser()?.role;
        return role === 'owner' || role === 'admin';
    });

    inviteEmail = '';
    inviteRole: UserRole = 'technician';

    async changeRole(uid: string, role: UserRole) {
        try {
            await this.teamService.updateMemberRole(uid, role);
            this.toastService.success('Role updated.');
        } catch {
            this.toastService.error('Could not update role. Please try again.');
        }
    }

    async changeStatus(uid: string, status: UserStatus) {
        try {
            await this.teamService.updateMemberStatus(uid, status);
            this.toastService.success('Status updated.');
        } catch {
            this.toastService.error('Could not update status. Please try again.');
        }
    }

    async sendInvite() {
        const uid = this.authService.currentUser()?.id;
        if (!uid || !this.inviteEmail) return;
        try {
            await this.teamService.createInvite(this.inviteEmail, this.inviteRole, uid);
            this.toastService.success('Invite created.');
            this.inviteEmail = '';
        } catch {
            this.toastService.error('Could not create the invite. Please try again.');
        }
    }

    async cancelInvite(id: string) {
        try {
            await this.teamService.deleteInvite(id);
            this.toastService.success('Invite cancelled.');
        } catch {
            this.toastService.error('Could not cancel the invite. Please try again.');
        }
    }
}
