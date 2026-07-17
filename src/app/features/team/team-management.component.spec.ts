import { describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { TeamManagementComponent } from './team-management.component';
import { TeamService } from '../../core/services/team.service';
import { AuthService } from '../../core/services/auth.service';
import { AppUser, UserRole } from '../../core/models/user.model';

function buildComponent(role: UserRole) {
    const currentUser = signal<AppUser | null>({
        id: 'u1', role, name: 'Test', email: 't@example.com', garageId: 'main', status: 'active',
        provider: 'email', emailVerified: true, createdAt: '', updatedAt: '', lastLogin: '',
    });

    const teamServiceStub = {
        members: signal([]),
        invites: signal([]),
        updateMemberRole: vi.fn(async () => { }),
        updateMemberStatus: vi.fn(async () => { }),
        createInvite: vi.fn(async () => { }),
        deleteInvite: vi.fn(async () => { }),
    };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
        imports: [TeamManagementComponent],
        providers: [
            provideRouter([]),
            { provide: TeamService, useValue: teamServiceStub },
            { provide: AuthService, useValue: { currentUser } },
        ],
    });

    return { component: TestBed.createComponent(TeamManagementComponent).componentInstance, teamServiceStub };
}

describe('TeamManagementComponent', () => {
    it('canManage is true for owner and admin, false for other roles', () => {
        expect(buildComponent('owner').component.canManage()).toBe(true);
        expect(buildComponent('admin').component.canManage()).toBe(true);
        expect(buildComponent('receptionist').component.canManage()).toBe(false);
        expect(buildComponent('technician').component.canManage()).toBe(false);
    });

    it('sendInvite creates an invite with the entered email/role and clears the input', async () => {
        const { component, teamServiceStub } = buildComponent('owner');
        component.inviteEmail = 'staff@example.com';
        component.inviteRole = 'receptionist';

        await component.sendInvite();

        expect(teamServiceStub.createInvite).toHaveBeenCalledWith('staff@example.com', 'receptionist', 'u1');
        expect(component.inviteEmail).toBe('');
    });

    it('cancelInvite deletes the invite by id', async () => {
        const { component, teamServiceStub } = buildComponent('owner');
        await component.cancelInvite('someone@example.com');
        expect(teamServiceStub.deleteInvite).toHaveBeenCalledWith('someone@example.com');
    });
});
