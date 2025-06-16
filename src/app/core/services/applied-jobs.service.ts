import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { JobService, Job } from './job.service';

export interface AppliedJob {
  id: string;
  userId: string;
  jobId: string;
  applicationId: string;
  appliedDate: string;
  status: 'pending' | 'submitted' | 'shortlisted' | 'reviewed' | 'rejected' | 'accepted';
}

export interface AppliedJobWithDetails extends AppliedJob {
  jobTitle: string;
  company: string;
  location: string;
  salary: string;
  jobType: string;
  postedDate: string;
}

@Injectable({
  providedIn: 'root',
})
export class AppliedJobsService {
  private apiUrl = 'http://localhost:3000';

  constructor(
    private http: HttpClient,
    private jobService: JobService
  ) {}

  /**
   * Get all applied jobs for a user
   */
  getAppliedJobs(userId: string): Observable<AppliedJob[]> {
    console.log('AppliedJobsService.getAppliedJobs called with userId:', userId);
    console.log('Making GET request to:', `${this.apiUrl}/appliedJobs?userId=${userId}`);
    
    return this.http.get<AppliedJob[]>(`${this.apiUrl}/appliedJobs?userId=${userId}`).pipe(
      map((response) => {
        console.log('AppliedJobsService.getAppliedJobs response:', response);
        return response;
      }),
      catchError((error) => {
        console.error('AppliedJobsService.getAppliedJobs error:', error);
        return of([]);
      })
    );
  }

  /**
   * Get applied jobs with full job details
   */
  getAppliedJobsWithDetails(userId: string): Observable<AppliedJobWithDetails[]> {
    return this.getAppliedJobs(userId).pipe(
      switchMap((appliedJobs) => {
        if (appliedJobs.length === 0) {
          return of([]);
        }

        // Get job details for each applied job
        const jobDetailRequests = appliedJobs.map((appliedJob) =>
          this.jobService.getJobById(appliedJob.jobId).pipe(
            map((job) => ({
              ...appliedJob,
              jobTitle: job?.title || 'Unknown Job',
              company: job?.company || 'Unknown Company',
              location: job?.location || 'Unknown Location',
              salary: job?.salary || 'Not specified',
              jobType: job?.type || 'Unknown',
              postedDate: job?.postedDate || '',
            })),
            catchError(() =>
              of({
                ...appliedJob,
                jobTitle: 'Job Not Found',
                company: 'Unknown Company',
                location: 'Unknown Location',
                salary: 'Not specified',
                jobType: 'Unknown',
                postedDate: '',
              })
            )
          )
        );

        return forkJoin(jobDetailRequests);
      }),
      catchError(() => of([]))
    );
  }

  /**
   * Add a new applied job record
   */
  addAppliedJob(userId: string, jobId: string, applicationId: string): Observable<AppliedJob> {
    const appliedJob: AppliedJob = {
      id: this.generateId(),
      userId,
      jobId,
      applicationId,
      appliedDate: new Date().toISOString(),
      status: 'submitted',
    };

    console.log('AppliedJobsService.addAppliedJob called with:', { userId, jobId, applicationId, appliedJob });
    console.log('Making POST request to:', `${this.apiUrl}/appliedJobs`);

    return this.http.post<AppliedJob>(`${this.apiUrl}/appliedJobs`, appliedJob).pipe(
      map((response) => {
        console.log('AppliedJobsService.addAppliedJob response:', response);
        return response;
      }),
      catchError((error) => {
        console.error('AppliedJobsService.addAppliedJob error:', error);
        throw error;
      })
    );
  }

  /**
   * Update applied job status
   */
  updateAppliedJobStatus(appliedJobId: string, status: AppliedJob['status']): Observable<AppliedJob> {
    return this.http.patch<AppliedJob>(`${this.apiUrl}/appliedJobs/${appliedJobId}`, { status });
  }

  /**
   * Check if user has applied to a specific job
   */
  hasUserAppliedToJob(userId: string, jobId: string): Observable<boolean> {
    return this.getAppliedJobs(userId).pipe(
      map((appliedJobs) => appliedJobs.some((aj) => aj.jobId === jobId)),
      catchError(() => of(false))
    );
  }

  /**
   * Get applied job IDs for a user (for efficient checking)
   */
  getAppliedJobIds(userId: string): Observable<Set<string>> {
    return this.getAppliedJobs(userId).pipe(
      map((appliedJobs) => new Set(appliedJobs.map((aj) => aj.jobId))),
      catchError(() => of(new Set<string>()))
    );
  }

  /**
   * Get count of applied jobs for a user
   */
  getAppliedJobsCount(userId: string): Observable<number> {
    return this.getAppliedJobs(userId).pipe(
      map((appliedJobs) => appliedJobs.length),
      catchError(() => of(0))
    );
  }

  /**
   * Get applied jobs by status
   */
  getAppliedJobsByStatus(userId: string, status: AppliedJob['status']): Observable<AppliedJobWithDetails[]> {
    return this.getAppliedJobsWithDetails(userId).pipe(
      map((appliedJobs) => appliedJobs.filter((aj) => aj.status === status))
    );
  }

  /**
   * Get recent applied jobs (last 5)
   */
  getRecentAppliedJobs(userId: string, limit: number = 5): Observable<AppliedJobWithDetails[]> {
    return this.getAppliedJobsWithDetails(userId).pipe(
      map((appliedJobs) => 
        appliedJobs
          .sort((a, b) => new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime())
          .slice(0, limit)
      )
    );
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}
