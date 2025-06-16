import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil, map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

import { AuthService, User } from '../../../../core/services/auth.service';
import { UserProfileService } from '../../../../core/services/user-profile.service';
import {
  JobApplicationService,
  JobApplication,
} from '../../../../core/services/job-application.service';
import { JobService } from '../../../../core/services/job.service';

interface AppliedJob {
  id: string;
  jobId: string;
  title: string;
  company: string;
  location: string;
  appliedDate: string;
  status: string;
  applicationId: string;
}

@Component({
  selector: 'app-applied-jobs',
  imports: [CommonModule, RouterModule],
  templateUrl: './applied-jobs.component.html',
  styleUrl: './applied-jobs.component.css',
})
export class AppliedJobsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  currentUser: User | null = null;
  appliedJobs: AppliedJob[] = [];
  isLoading = true;
  error: string | null = null;

  constructor(
    private authService: AuthService,
    private userProfileService: UserProfileService,
    private jobApplicationService: JobApplicationService,
    private jobService: JobService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => {
        this.currentUser = user;
        if (user) {
          this.loadAppliedJobs(user.id);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadAppliedJobs(userId: string): void {
    this.isLoading = true;
    this.error = null;

    // First try to get data from userProfile.dashboardData
    this.userProfileService
      .getUserProfile(userId)
      .pipe(
        takeUntil(this.destroy$),
        map((profile) => {
          if (
            profile &&
            profile.dashboardData &&
            profile.dashboardData.appliedJobs
          ) {
            return profile.dashboardData.appliedJobs.map((app) => ({
              id: app.applicationId,
              jobId: app.jobId,
              title: app.jobTitle,
              company: app.company,
              location: app.location,
              appliedDate: app.appliedDate,
              status: app.status,
              applicationId: app.applicationId,
            }));
          }
          throw new Error('No dashboard data in profile');
        }),
        catchError(() => {
          // Fallback to jobApplications collection
          return this.jobApplicationService.getUserApplications(userId).pipe(
            map((applications: JobApplication[]) => {
              if (applications.length === 0) {
                return [];
              }

              // Get job details for each application
              const jobRequests = applications.map((app) =>
                this.jobService.getJobById(app.jobId).pipe(
                  map((job) => ({
                    id: app.id,
                    jobId: app.jobId,
                    title: job?.title || 'Unknown Job',
                    company: job?.company || 'Unknown Company',
                    location: job?.location || 'Unknown Location',
                    appliedDate: app.submittedAt,
                    status: app.status,
                    applicationId: app.id,
                  })),
                  catchError(() =>
                    of({
                      id: app.id,
                      jobId: app.jobId,
                      title: 'Unknown Job',
                      company: 'Unknown Company',
                      location: 'Unknown Location',
                      appliedDate: app.submittedAt,
                      status: app.status,
                      applicationId: app.id,
                    })
                  )
                )
              );

              return forkJoin(jobRequests);
            }),
            map((jobRequests: any) => jobRequests || [])
          );
        })
      )
      .subscribe({
        next: (jobs) => {
          if (Array.isArray(jobs)) {
            this.appliedJobs = jobs.sort(
              (a, b) =>
                new Date(b.appliedDate).getTime() -
                new Date(a.appliedDate).getTime()
            );
          } else {
            // Handle the case where jobs is an Observable from forkJoin
            jobs.subscribe({
              next: (resolvedJobs: AppliedJob[]) => {
                this.appliedJobs = resolvedJobs.sort(
                  (a: AppliedJob, b: AppliedJob) =>
                    new Date(b.appliedDate).getTime() -
                    new Date(a.appliedDate).getTime()
                );
                this.isLoading = false;
              },
              error: (error: any) => {
                console.error('Error resolving job details:', error);
                this.error = 'Failed to load job details';
                this.isLoading = false;
              },
            });
            return;
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading applied jobs:', error);
          this.error = 'Failed to load applied jobs';
          this.isLoading = false;
        },
      });
  }

  getStatusDisplayText(status: string): string {
    switch (status) {
      case 'submitted':
        return 'Submitted';
      case 'under-review':
        return 'Under Review';
      case 'pending':
        return 'Pending';
      case 'interview':
        return 'Interview Scheduled';
      case 'shortlisted':
        return 'Shortlisted';
      case 'reviewed':
        return 'Reviewed';
      case 'rejected':
        return 'Rejected';
      case 'accepted':
        return 'Accepted';
      default:
        return status;
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'submitted':
        return 'status-submitted';
      case 'under-review':
        return 'status-under-review';
      case 'pending':
        return 'status-pending';
      case 'interview':
        return 'status-interview';
      case 'shortlisted':
        return 'status-shortlisted';
      case 'reviewed':
        return 'status-reviewed';
      case 'rejected':
        return 'status-rejected';
      case 'accepted':
        return 'status-accepted';
      default:
        return 'status-submitted';
    }
  }
}
