import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { AuthService, User } from '../../../core/services/auth.service';
import {
  DashboardService,
  DashboardStats,
  RecentApplication,
  RecommendedJob,
} from '../../../core/services/dashboard.service';

@Component({
  selector: 'app-job-seeker-dashboard',
  imports: [CommonModule, RouterModule],
  templateUrl: './job-seeker-dashboard.component.html',
  styleUrl: './job-seeker-dashboard.component.css',
})
export class JobSeekerDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  currentUser: User | null = null;
  isLoading = true;

  stats: DashboardStats = {
    id: '',
    userId: '',
    appliedJobs: 0,
    savedJobs: 0,
    profileViews: 0,
    interviewsScheduled: 0,
    lastUpdated: '',
  };

  recentApplications: RecentApplication[] = [];
  recommendedJobs: RecommendedJob[] = [];

  constructor(
    private authService: AuthService,
    private dashboardService: DashboardService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => {
        this.currentUser = user;
        if (user) {
          this.loadDashboardData(user.id);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadDashboardData(userId: string): void {
    this.isLoading = true;

    // Load dashboard stats
    this.dashboardService
      .getDashboardStats(userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats) => {
          this.stats = stats;
        },
        error: (error) => {
          console.error('Error loading dashboard stats:', error);
        },
      });

    // Load recent applications
    this.dashboardService
      .getRecentApplications(userId, 3)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (applications) => {
          this.recentApplications = applications;
        },
        error: (error) => {
          console.error('Error loading recent applications:', error);
        },
      });

    // Load recommended jobs
    this.dashboardService
      .getRecommendedJobs(userId, 3)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isLoading = false))
      )
      .subscribe({
        next: (jobs) => {
          this.recommendedJobs = jobs;
        },
        error: (error) => {
          console.error('Error loading recommended jobs:', error);
        },
      });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'submitted':
      case 'pending':
        return 'status-pending';
      case 'under-review':
        return 'status-review';
      case 'interview':
        return 'status-interview';
      case 'rejected':
        return 'status-rejected';
      case 'accepted':
        return 'status-accepted';
      default:
        return 'status-pending';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'submitted':
        return 'Submitted';
      case 'pending':
        return 'Under Review';
      case 'under-review':
        return 'Under Review';
      case 'interview':
        return 'Interview Scheduled';
      case 'rejected':
        return 'Not Selected';
      case 'accepted':
        return 'Offer Received';
      default:
        return 'Unknown';
    }
  }

  getMatchScoreClass(score: number): string {
    if (score >= 90) return 'match-excellent';
    if (score >= 80) return 'match-good';
    if (score >= 70) return 'match-fair';
    return 'match-poor';
  }

  formatInterviewDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata', // IST timezone for India
      });
    } catch (error) {
      return dateString;
    }
  }
}
