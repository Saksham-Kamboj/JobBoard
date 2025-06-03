import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService, User } from '../../../core/services/auth.service';
import { JobService, Job } from '../../../core/services/job.service';
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
    // In a real app, this would check if the user has already applied
    // For now, we'll simulate this
    this.hasApplied = false;
  }

  applyForJob() {
    if (!this.currentUser) {
      this.router.navigate(['/auth/signin'], {
        queryParams: { returnUrl: this.router.url },
      });
      return;
    }

    if (this.currentUser.role !== 'job-seeker') {
      this.errorMessage = 'Only job seekers can apply for jobs';
      return;
    }

    this.isApplying = true;
    this.errorMessage = '';

    // Simulate application submission
    setTimeout(() => {
      this.isApplying = false;
      this.hasApplied = true;
      this.successMessage = 'Application submitted successfully!';

      // Clear success message after 5 seconds
      setTimeout(() => {
        this.successMessage = '';
      }, 5000);
    }, 1000);
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
}
