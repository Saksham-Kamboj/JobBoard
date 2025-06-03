import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { JobService, Job } from '../../../core/services/job.service';
import {
  SearchService,
  SearchFilters,
  SearchResults,
} from '../../../core/services/search.service';
import { NavigationService } from '../../../core/services/navigation.service';

@Component({
  selector: 'app-job-list',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './job-list.component.html',
  styleUrl: './job-list.component.css',
})
export class JobListComponent implements OnInit, OnDestroy {
  jobs: Job[] = [];
  isLoading = true;
  errorMessage = '';
  searchResults: SearchResults = {
    jobs: [],
    totalCount: 0,
    filteredCount: 0,
    appliedFilters: {},
  };

  // Search and filter properties
  searchQuery = '';
  searchLocation = '';
  selectedJobType = '';
  selectedExperienceLevel = '';
  selectedSalaryRange = '';
  sortBy = 'newest';

  // Available filter options
  jobTypes = [
    { value: '', label: 'All Types' },
    { value: 'full-time', label: 'Full-time' },
    { value: 'part-time', label: 'Part-time' },
    { value: 'contract', label: 'Contract' },
    { value: 'remote', label: 'Remote' },
  ];

  experienceLevels = [
    { value: '', label: 'All Levels' },
    { value: 'entry', label: 'Entry Level' },
    { value: 'mid', label: 'Mid Level' },
    { value: 'senior', label: 'Senior Level' },
    { value: 'executive', label: 'Executive' },
  ];

  salaryRanges = [
    { value: '', label: 'All Salaries' },
    { value: '0-50k', label: '$0 - $50k' },
    { value: '50k-100k', label: '$50k - $100k' },
    { value: '100k-150k', label: '$100k - $150k' },
    { value: '150k+', label: '$150k+' },
  ];

  sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'salary-high', label: 'Salary: High to Low' },
    { value: 'salary-low', label: 'Salary: Low to High' },
    { value: 'company', label: 'Company A-Z' },
  ];

  private subscriptions = new Subscription();

  constructor(
    private jobService: JobService,
    private searchService: SearchService,
    private route: ActivatedRoute,
    private router: Router,
    private navigationService: NavigationService
  ) {}

  ngOnInit(): void {
    this.initializeSearch();
    this.subscribeToSearchResults();
    this.loadQueryParams();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  initializeSearch(): void {
    // Subscribe to search results
    const searchSub = this.searchService.searchResults$.subscribe({
      next: (results) => {
        this.searchResults = results;
        this.jobs = this.sortJobs(results.jobs);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error in search results:', error);
        this.errorMessage = 'Failed to load jobs. Please try again later.';
        this.isLoading = false;
      },
    });

    this.subscriptions.add(searchSub);
  }

  subscribeToSearchResults(): void {
    // Subscribe to route query parameters
    const routeSub = this.route.queryParams.subscribe((params) => {
      // Update component state from URL parameters
      this.searchQuery = params['q'] || '';
      this.searchLocation = params['location'] || '';
      this.selectedJobType = params['type'] || '';
      this.selectedExperienceLevel = params['level'] || '';
      this.selectedSalaryRange = params['salary'] || '';
      this.sortBy = params['sort'] || 'newest';

      // Update search service with parameters (without updating URL again)
      const filters: SearchFilters = {
        query: this.searchQuery || undefined,
        location: this.searchLocation || undefined,
        jobType: this.selectedJobType || undefined,
        experienceLevel: this.selectedExperienceLevel || undefined,
        salaryRange: this.selectedSalaryRange || undefined,
      };

      this.searchService.updateFilters(filters);
    });

    this.subscriptions.add(routeSub);
  }

  loadQueryParams(): void {
    // Initial load based on current query params
    const params = this.route.snapshot.queryParams;
    if (Object.keys(params).length === 0) {
      // No search params, load all jobs
      this.searchService.clearFilters();
    }
  }

  updateSearchFilters(): void {
    const filters: SearchFilters = {
      query: this.searchQuery || undefined,
      location: this.searchLocation || undefined,
      jobType: this.selectedJobType || undefined,
      experienceLevel: this.selectedExperienceLevel || undefined,
      salaryRange: this.selectedSalaryRange || undefined,
    };

    this.searchService.updateFilters(filters);
    this.updateUrlParams();
  }

  updateUrlParams(): void {
    const queryParams: any = {};

    // Add non-empty parameters to URL
    if (this.searchQuery?.trim()) {
      queryParams.q = this.searchQuery.trim();
    }
    if (this.searchLocation?.trim()) {
      queryParams.location = this.searchLocation.trim();
    }
    if (this.selectedJobType) {
      queryParams.type = this.selectedJobType;
    }
    if (this.selectedExperienceLevel) {
      queryParams.level = this.selectedExperienceLevel;
    }
    if (this.selectedSalaryRange) {
      queryParams.salary = this.selectedSalaryRange;
    }
    if (this.sortBy && this.sortBy !== 'newest') {
      queryParams.sort = this.sortBy;
    }

    // Store current state in navigation service
    this.navigationService.storeJobsPageState('/jobs', queryParams);

    // Update URL without triggering navigation
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'replace',
    });
  }

  navigateToJobDetail(jobId: string): void {
    // Get current query parameters
    const currentParams = this.route.snapshot.queryParams;

    // Store current jobs page state before navigation
    this.navigationService.storeJobsPageState('/jobs', currentParams);

    // Navigate to job detail
    this.router.navigate(['/jobs', jobId]);
  }

  onSearch(): void {
    this.updateSearchFilters();
  }

  onFilterChange(): void {
    this.updateSearchFilters();
  }

  onSortChange(): void {
    this.jobs = this.sortJobs(this.searchResults.jobs);
    this.updateUrlParams();
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.searchLocation = '';
    this.selectedJobType = '';
    this.selectedExperienceLevel = '';
    this.selectedSalaryRange = '';
    this.sortBy = 'newest';
    this.searchService.clearFilters();

    // Clear URL parameters
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
      queryParamsHandling: 'replace',
    });
  }

  sortJobs(jobs: Job[]): Job[] {
    const sortedJobs = [...jobs];

    switch (this.sortBy) {
      case 'newest':
        return sortedJobs.sort(
          (a, b) =>
            new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime()
        );
      case 'oldest':
        return sortedJobs.sort(
          (a, b) =>
            new Date(a.postedDate).getTime() - new Date(b.postedDate).getTime()
        );
      case 'salary-high':
        return sortedJobs.sort((a, b) => {
          const salaryA = this.extractMaxSalary(a.salary);
          const salaryB = this.extractMaxSalary(b.salary);
          return salaryB - salaryA;
        });
      case 'salary-low':
        return sortedJobs.sort((a, b) => {
          const salaryA = this.extractMaxSalary(a.salary);
          const salaryB = this.extractMaxSalary(b.salary);
          return salaryA - salaryB;
        });
      case 'company':
        return sortedJobs.sort((a, b) => a.company.localeCompare(b.company));
      default:
        return sortedJobs;
    }
  }

  extractMaxSalary(salary: string): number {
    const numbers = salary.match(/\d+/g);
    if (!numbers) return 0;

    const values = numbers.map((num) => {
      const value = parseInt(num);
      if (value < 1000 && salary.includes('k')) {
        return value * 1000;
      }
      return value;
    });

    return Math.max(...values);
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

  getResultsText(): string {
    const { filteredCount, totalCount, searchQuery } = this.searchResults;

    if (searchQuery) {
      return `${filteredCount} jobs found for "${searchQuery}"`;
    } else if (filteredCount < totalCount) {
      return `${filteredCount} of ${totalCount} jobs`;
    } else {
      return `${totalCount} jobs found`;
    }
  }

  hasActiveFilters(): boolean {
    return !!(
      this.searchQuery ||
      this.searchLocation ||
      this.selectedJobType ||
      this.selectedExperienceLevel ||
      this.selectedSalaryRange
    );
  }

  getExperienceLevelDisplay(level: string): string {
    const levelMap = this.experienceLevels.find((l) => l.value === level);
    return levelMap ? levelMap.label : level;
  }

  getSalaryRangeDisplay(range: string): string {
    const rangeMap = this.salaryRanges.find((r) => r.value === range);
    return rangeMap ? rangeMap.label : range;
  }
}
