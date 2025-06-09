import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService, User } from '../../../core/services/auth.service';
import { JobService, Job } from '../../../core/services/job.service';
import { JobApplicationService } from '../../../core/services/job-application.service';
import { NavigationService } from '../../../core/services/navigation.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-job-detail',
  imports: [CommonModule, RouterModule],
  templateUrl: './job-detail.component.html',
  styleUrl: './job-detail.component.css',
})
export class JobDetailComponent implements OnInit, OnDestroy {
  job: Job | null = null;
  currentUser: User | null = null;
  isLoading = true;
  hasApplied = false;
  isApplying = false;
  errorMessage = '';
  successMessage = '';

  private routeSubscription: Subscription = new Subscription();
  private authSubscription: Subscription = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private jobService: JobService,
    private jobApplicationService: JobApplicationService,
    private navigationService: NavigationService
  ) {}

  ngOnInit() {
    // Subscribe to route parameters
    this.routeSubscription.add(
      this.route.params.subscribe((params) => {
        const jobId = params['id'];
        if (jobId) {
          this.loadJob(jobId);
        }
      })
    );

    // Subscribe to authentication state
    this.authSubscription.add(
      this.authService.currentUser$.subscribe((user) => {
        this.currentUser = user;
        if (user && this.job) {
          this.checkApplicationStatus();
        }
      })
    );
  }

  ngOnDestroy() {
    this.routeSubscription.unsubscribe();
    this.authSubscription.unsubscribe();
  }

  private loadJob(jobId: string) {
    this.isLoading = true;
    this.errorMessage = '';

    this.jobService.getJobById(jobId).subscribe({
      next: (job) => {
        this.job = job;
        this.isLoading = false;

        if (!this.job) {
          this.errorMessage = 'Job not found';
        } else if (this.currentUser) {
          this.checkApplicationStatus();
        }
      },
      error: (error) => {
        console.error('Error loading job:', error);
        this.errorMessage =
          'Failed to load job details. Please try again later.';
        this.isLoading = false;
      },
    });
  }

  private checkApplicationStatus() {
    if (!this.currentUser || !this.job) {
      return;
    }

    this.jobApplicationService
      .checkIfUserApplied(this.currentUser.id, this.job.id)
      .subscribe({
        next: (hasApplied) => {
          this.hasApplied = hasApplied;
        },
        error: (error) => {
          console.error('Error checking application status:', error);
          this.hasApplied = false;
        },
      });
  }

  goBack() {
    // Use navigation service to go back with preserved filters
    this.navigationService.navigateBackToJobs();
  }

  hasStoredFilters(): boolean {
    return this.navigationService.hasStoredFilters();
  }

  getStoredFiltersDescription(): string {
    return this.navigationService.getStoredFiltersDescription();
  }

  shareJob() {
    if (navigator.share && this.job) {
      navigator.share({
        title: this.job.title,
        text: `Check out this job opportunity: ${this.job.title} at ${this.job.company}`,
        url: window.location.href,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href).then(() => {
        this.successMessage = 'Job link copied to clipboard!';
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      });
    }
  }

  getExperienceLevelDisplay(): string {
    if (!this.job) return '';

    const levels: { [key: string]: string } = {
      entry: 'Entry Level',
      mid: 'Mid Level',
      senior: 'Senior Level',
      executive: 'Executive Level',
    };

    return levels[this.job.experienceLevel] || this.job.experienceLevel;
  }

  getJobTypeDisplay(): string {
    if (!this.job) return '';

    const types: { [key: string]: string } = {
      'full-time': 'Full Time',
      'part-time': 'Part Time',
      contract: 'Contract',
      remote: 'Remote',
    };

    return types[this.job.type] || this.job.type;
  }

  getDaysAgo(): number {
    if (!this.job) return 0;

    const postedDate = new Date(this.job.postedDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - postedDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  }

  getDaysUntilDeadline(): number {
    if (!this.job) return 0;

    const deadline = new Date(this.job.applicationDeadline);
    const today = new Date();
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  }

  isDeadlineSoon(): boolean {
    return this.getDaysUntilDeadline() <= 7 && this.getDaysUntilDeadline() > 0;
  }

  isDeadlinePassed(): boolean {
    return this.getDaysUntilDeadline() < 0;
  }

  applyForJob(): void {
    if (!this.job) {
      return;
    }

    // Check if user is authenticated
    if (!this.currentUser) {
      this.router.navigate(['/auth/signin'], {
        queryParams: { returnUrl: this.router.url },
      });
      return;
    }

    // Check if user is a job seeker
    if (this.currentUser.role !== 'job-seeker') {
      this.errorMessage = 'Only job seekers can apply for jobs';
      setTimeout(() => {
        this.errorMessage = '';
      }, 3000);
      return;
    }

    // Navigate to job application page
    this.router.navigate(['/jobs', this.job.id, 'apply']);
  }

  navigateToSignIn(): void {
    this.router.navigate(['/auth/signin'], {
      queryParams: { returnUrl: this.router.url },
    });
  }

  canEditJob(): boolean {
    if (!this.currentUser || !this.job) {
      return false;
    }

    // Admin can edit any job
    if (this.currentUser.role === 'admin') {
      return true;
    }

    // Company users can edit their own jobs
    if (this.currentUser.role === 'company') {
      return (
        (this.job as any).companyId === this.currentUser.id ||
        this.job.company === (this.currentUser as any).companyName
      );
    }

    return false;
  }

  editJob(): void {
    if (!this.job || !this.canEditJob()) {
      return;
    }

    this.router.navigate(['/jobs', this.job.id, 'edit']);
  }
}
