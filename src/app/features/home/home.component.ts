import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { JobService, Job } from '../../core/services/job.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-home',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit {
  searchQuery = '';
  searchLocation = '';
  featuredJobs: Job[] = [];
  isLoading = true;
  isAuthenticated = false;

  // Platform statistics
  stats = {
    totalJobs: 0,
    totalCompanies: 0,
    totalApplications: 0,
    successfulPlacements: 0
  };

  // Job categories
  jobCategories = [
    {
      name: 'Technology',
      icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      count: 0,
      color: 'bg-blue-100 text-blue-600'
    },
    {
      name: 'Design',
      icon: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z',
      count: 0,
      color: 'bg-purple-100 text-purple-600'
    },
    {
      name: 'Marketing',
      icon: 'M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z',
      count: 0,
      color: 'bg-green-100 text-green-600'
    },
    {
      name: 'Sales',
      icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
      count: 0,
      color: 'bg-orange-100 text-orange-600'
    },
    {
      name: 'Finance',
      icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1',
      count: 0,
      color: 'bg-yellow-100 text-yellow-600'
    },
    {
      name: 'Healthcare',
      icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
      count: 0,
      color: 'bg-red-100 text-red-600'
    }
  ];

  // Testimonials
  testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Software Engineer',
      company: 'TechCorp',
      content: 'Found my dream job within 2 weeks! The platform made it so easy to connect with great companies.',
      avatar: 'SJ'
    },
    {
      name: 'Michael Chen',
      role: 'Product Manager',
      company: 'InnovateCorp',
      content: 'As a hiring manager, this platform has helped us find exceptional talent quickly and efficiently.',
      avatar: 'MC'
    },
    {
      name: 'Emily Rodriguez',
      role: 'UX Designer',
      company: 'Design Studio Pro',
      content: 'The job matching algorithm is incredible. I received relevant opportunities that matched my skills perfectly.',
      avatar: 'ER'
    }
  ];

  constructor(
    private jobService: JobService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.isAuthenticated = this.authService.isAuthenticated();
    this.loadFeaturedJobs();
    this.loadStats();
  }

  loadFeaturedJobs(): void {
    this.jobService.getAllJobs().subscribe({
      next: (jobs) => {
        // Get featured jobs or first 6 jobs
        this.featuredJobs = jobs.filter(job => job.featured).slice(0, 6);
        if (this.featuredJobs.length < 6) {
          const remainingJobs = jobs.filter(job => !job.featured).slice(0, 6 - this.featuredJobs.length);
          this.featuredJobs = [...this.featuredJobs, ...remainingJobs];
        }
        this.isLoading = false;
        this.updateCategoryCounts(jobs);
      },
      error: (error) => {
        console.error('Error loading featured jobs:', error);
        this.isLoading = false;
      }
    });
  }

  loadStats(): void {
    this.jobService.getAllJobs().subscribe({
      next: (jobs) => {
        this.stats.totalJobs = jobs.length;
        this.stats.totalCompanies = new Set(jobs.map(job => job.company)).size;
        this.stats.totalApplications = jobs.reduce((sum, job) => sum + (job.applicationCount || 0), 0);
        this.stats.successfulPlacements = Math.floor(this.stats.totalApplications * 0.15); // Simulated
      }
    });
  }

  updateCategoryCounts(jobs: Job[]): void {
    // Simple categorization based on job titles
    jobs.forEach(job => {
      const title = job.title.toLowerCase();
      if (title.includes('developer') || title.includes('engineer') || title.includes('tech')) {
        this.jobCategories[0].count++;
      } else if (title.includes('design') || title.includes('ui') || title.includes('ux')) {
        this.jobCategories[1].count++;
      } else if (title.includes('marketing') || title.includes('content')) {
        this.jobCategories[2].count++;
      } else if (title.includes('sales') || title.includes('business')) {
        this.jobCategories[3].count++;
      } else if (title.includes('finance') || title.includes('accounting')) {
        this.jobCategories[4].count++;
      } else if (title.includes('health') || title.includes('medical')) {
        this.jobCategories[5].count++;
      }
    });
  }

  onSearch(): void {
    // Navigate to jobs page with search parameters
    const queryParams: any = {};
    if (this.searchQuery.trim()) {
      queryParams.q = this.searchQuery.trim();
    }
    if (this.searchLocation.trim()) {
      queryParams.location = this.searchLocation.trim();
    }
    
    // For now, just navigate to jobs page
    // In a real app, you'd pass these as query parameters
    window.location.href = '/jobs';
  }

  getTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return 'Today';
    } else if (diffInDays === 1) {
      return '1 day ago';
    } else {
      return `${diffInDays} days ago`;
    }
  }

  getJobTypeDisplay(type: string): string {
    const types: { [key: string]: string } = {
      'full-time': 'Full Time',
      'part-time': 'Part Time',
      contract: 'Contract',
      remote: 'Remote',
    };
    return types[type] || type;
  }
}
