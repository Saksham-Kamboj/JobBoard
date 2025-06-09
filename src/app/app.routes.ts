import { Routes } from '@angular/router';
import { AuthGuard, RoleGuard, GuestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Home page
  {
    path: '',
    loadComponent: () =>
      import('./features/home/home.component').then((m) => m.HomeComponent),
  },

  // Job posting route (for admin and company roles) - MUST come before jobs/:id
  {
    path: 'post-job',
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['admin', 'company'] },
    loadComponent: () =>
      import('./features/jobs/job-post/job-post.component').then(
        (m) => m.JobPostComponent
      ),
  },

  // Public routes
  {
    path: 'jobs',
    loadComponent: () =>
      import('./features/jobs/job-list/job-list.component').then(
        (m) => m.JobListComponent
      ),
  },
  // Redirect old job creation route to new one
  {
    path: 'jobs/create',
    redirectTo: '/post-job',
    pathMatch: 'full',
  },
  {
    path: 'jobs/:id/edit',
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['admin', 'company'] },
    loadComponent: () =>
      import('./features/jobs/job-edit/job-edit.component').then(
        (m) => m.JobEditComponent
      ),
  },
  {
    path: 'jobs/:id/apply',
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'job-seeker' },
    loadComponent: () =>
      import('./features/jobs/job-apply/job-apply.component').then(
        (m) => m.JobApplyComponent
      ),
  },
  {
    path: 'jobs/:id',
    loadComponent: () =>
      import('./features/jobs/job-detail/job-detail.component').then(
        (m) => m.JobDetailComponent
      ),
  },

  // Authentication routes (only for guests)
  {
    path: 'auth',
    canActivate: [GuestGuard],
    children: [
      {
        path: 'signin',
        loadComponent: () =>
          import('./auth/signin/signin.component').then(
            (m) => m.SigninComponent
          ),
      },
      {
        path: 'signup',
        loadComponent: () =>
          import('./auth/signup/signup.component').then(
            (m) => m.SignupComponent
          ),
      },
      {
        path: '',
        redirectTo: 'signin',
        pathMatch: 'full',
      },
    ],
  },

  // Protected routes for job seekers
  {
    path: 'dashboard',
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'job-seeker' },
    loadComponent: () =>
      import(
        './features/dashboard/job-seeker-dashboard/job-seeker-dashboard.component'
      ).then((m) => m.JobSeekerDashboardComponent),
  },

  // Settings page (accessible to all authenticated users)
  {
    path: 'settings',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('./features/settings/settings.component').then(
        (m) => m.SettingsComponent
      ),
  },

  // Profile page (accessible to all authenticated users)
  {
    path: 'profile',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('./features/profile/profile.component').then(
        (m) => m.ProfileComponent
      ),
  },

  // Protected routes for admins
  {
    path: 'admin',
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'admin' },
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import(
            './features/dashboard/admin-dashboard/admin-dashboard.component'
          ).then((m) => m.AdminDashboardComponent),
      },
      {
        path: 'jobs',
        loadComponent: () =>
          import(
            './features/jobs/job-management/job-management.component'
          ).then((m) => m.JobManagementComponent),
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },

  // Wildcard route - must be last
  {
    path: '**',
    redirectTo: '/jobs',
  },
];
