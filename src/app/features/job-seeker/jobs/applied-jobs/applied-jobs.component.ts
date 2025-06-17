import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
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
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './applied-jobs.component.html',
  styleUrl: './applied-jobs.component.css',
})
export class AppliedJobsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  currentUser: User | null = null;
  appliedJobs: AppliedJob[] = [];
  filteredJobs: AppliedJob[] = [];
  isLoading = true;
  error: string | null = null;

  // Filter and search properties
  searchQuery = '';
  statusFilter = '';
  sortBy = 'date-desc';

  constructor(
    private authService: AuthService,
    private userProfileService: UserProfileService,
    private jobApplicationService: JobApplicationService,
    private jobService: JobService,
    private router: Router
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
            this.applyFiltersAndSort();
          } else {
            // Handle the case where jobs is an Observable from forkJoin
            jobs.subscribe({
              next: (resolvedJobs: AppliedJob[]) => {
                this.appliedJobs = resolvedJobs.sort(
                  (a: AppliedJob, b: AppliedJob) =>
                    new Date(b.appliedDate).getTime() -
                    new Date(a.appliedDate).getTime()
                );
                this.applyFiltersAndSort();
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
    switch (status.toLowerCase()) {
      case 'submitted':
      case 'applied':
        return 'Submitted';
      case 'under-review':
        return 'Under Review';
      case 'pending':
        return 'Pending';
      case 'reviewed':
        return 'Reviewed';
      case 'interview':
      case 'interview-scheduled':
        return 'Interview Scheduled';
      case 'shortlisted':
        return 'Shortlisted';
      case 'rejected':
        return 'Rejected';
      case 'accepted':
        return 'Accepted';
      default:
        // Capitalize first letter for unknown statuses
        return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    }
  }

  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'submitted':
      case 'applied':
        return 'status-submitted';
      case 'under-review':
        return 'status-under-review';
      case 'pending':
        return 'status-pending';
      case 'reviewed':
        return 'status-reviewed';
      case 'interview':
      case 'interview-scheduled':
        return 'status-interview';
      case 'shortlisted':
        return 'status-shortlisted';
      case 'rejected':
        return 'status-rejected';
      case 'accepted':
        return 'status-accepted';
      default:
        return 'status-submitted';
    }
  }

  // New methods for enhanced functionality
  getActiveApplicationsCount(): number {
    return this.appliedJobs.filter(
      (job) => !['rejected', 'accepted'].includes(job.status)
    ).length;
  }

  onSearch(): void {
    this.applyFiltersAndSort();
  }

  onFilterChange(): void {
    this.applyFiltersAndSort();
  }

  onSortChange(): void {
    this.applyFiltersAndSort();
  }

  private applyFiltersAndSort(): void {
    let filtered = [...this.appliedJobs];

    // Apply search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (job) =>
          job.title.toLowerCase().includes(query) ||
          job.company.toLowerCase().includes(query) ||
          job.location.toLowerCase().includes(query)
      );
    }

    // Apply status filter with improved matching
    if (this.statusFilter) {
      filtered = filtered.filter((job) => {
        const jobStatus = job.status.toLowerCase();
        const filterStatus = this.statusFilter.toLowerCase();

        // Direct match
        if (jobStatus === filterStatus) {
          return true;
        }

        // Handle status variations and synonyms
        switch (filterStatus) {
          case 'interview':
            return (
              jobStatus === 'interview' ||
              jobStatus === 'interview-scheduled' ||
              jobStatus === 'shortlisted'
            );
          case 'under-review':
            return (
              jobStatus === 'under-review' ||
              jobStatus === 'pending' ||
              jobStatus === 'reviewed'
            );
          case 'submitted':
            return jobStatus === 'submitted' || jobStatus === 'applied';
          default:
            return jobStatus === filterStatus;
        }
      });
    }

    // Apply sorting
    switch (this.sortBy) {
      case 'date-asc':
        filtered.sort(
          (a, b) =>
            new Date(a.appliedDate).getTime() -
            new Date(b.appliedDate).getTime()
        );
        break;
      case 'date-desc':
        filtered.sort(
          (a, b) =>
            new Date(b.appliedDate).getTime() -
            new Date(a.appliedDate).getTime()
        );
        break;
      case 'company':
        filtered.sort((a, b) => a.company.localeCompare(b.company));
        break;
      case 'status':
        filtered.sort((a, b) => a.status.localeCompare(b.status));
        break;
    }

    this.filteredJobs = filtered;
  }

  trackByJobId(index: number, job: AppliedJob): string {
    return job.id;
  }

  getTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return 'today';
    } else if (diffInDays === 1) {
      return '1 day ago';
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7);
      return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
    } else if (diffInDays < 365) {
      const months = Math.floor(diffInDays / 30);
      return months === 1 ? '1 month ago' : `${months} months ago`;
    } else {
      const years = Math.floor(diffInDays / 365);
      return years === 1 ? '1 year ago' : `${years} years ago`;
    }
  }

  // Enhanced Progress step methods
  isStepActive(step: string, currentStatus: string): boolean {
    const currentStep = this.getCurrentProgressStep(currentStatus);
    return step === currentStep;
  }

  isStepCompleted(step: string, currentStatus: string): boolean {
    const stepOrder = ['submitted', 'under-review', 'interview', 'final'];
    const stepIndex = stepOrder.indexOf(step);
    const currentIndex = this.getDetailedStatusIndex(currentStatus);

    // A step is completed if the current progress is beyond it
    return currentIndex > stepIndex;
  }

  private getCurrentProgressStep(status: string): string {
    switch (status.toLowerCase()) {
      case 'submitted':
      case 'applied':
        return 'submitted';
      case 'under-review':
      case 'pending':
        return 'under-review';
      case 'reviewed':
      case 'shortlisted':
        return 'interview'; // Shortlisted means moving towards interview
      case 'interview':
      case 'interview-scheduled':
        return 'interview';
      case 'accepted':
      case 'rejected':
        return 'final';
      default:
        return 'submitted';
    }
  }

  private getDetailedStatusIndex(status: string): number {
    switch (status.toLowerCase()) {
      case 'submitted':
      case 'applied':
        return 0.5; // Halfway through submitted step
      case 'under-review':
        return 1.0; // Completed submitted, at review
      case 'pending':
        return 1.3; // In review process
      case 'reviewed':
        return 1.7; // Review completed, moving to next
      case 'shortlisted':
        return 2.3; // Shortlisted means progressing towards interview
      case 'interview':
      case 'interview-scheduled':
        return 2.7; // Interview scheduled/in progress
      case 'accepted':
        return 4.0; // Final step completed successfully
      case 'rejected':
        return 3.5; // Final step completed but rejected
      default:
        return 0.5;
    }
  }

  // Get progress percentage for the progress line
  getProgressPercentage(currentStatus: string): number {
    const index = this.getDetailedStatusIndex(currentStatus);
    // Convert to percentage (0-100%)
    return Math.min((index / 4.0) * 100, 100);
  }

  // Action methods
  viewJobDetails(jobId: string): void {
    this.router.navigate(['/jobs', jobId]);
  }

  downloadApplication(job: AppliedJob): void {
    // Implement download functionality
    console.log('Downloading application for:', job.title);
    // This would typically generate and download a PDF of the application
  }
}
