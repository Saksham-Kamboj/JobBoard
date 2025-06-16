import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { PersonalInfo, Resume } from './user-profile.service';
import { ApplicationStatus } from './dashboard.service';
import { AppliedJobsService } from './applied-jobs.service';

export interface JobApplicationData {
  personalInfo: PersonalInfo;
  coverLetter: string;
  resume: Resume;
  additionalDocuments: any[];
}

export interface JobApplication {
  id: string;
  jobId: string;
  userId: string;
  applicationData: JobApplicationData;
  status:
    | 'draft'
    | 'submitted'
    | 'under-review'
    | 'pending'
    | 'interview'
    | 'shortlisted'
    | 'reviewed'
    | 'rejected'
    | 'accepted';
  submittedAt: string;
  updatedAt: string;
  notes: string;
  applicationStatus?: ApplicationStatus;
}

@Injectable({
  providedIn: 'root',
})
export class JobApplicationService {
  private apiUrl = 'http://localhost:3000/jobApplications';

  constructor(
    private http: HttpClient,
    private appliedJobsService: AppliedJobsService
  ) {}

  submitJobApplication(
    application: Omit<JobApplication, 'id' | 'submittedAt' | 'updatedAt'>
  ): Observable<JobApplication> {
    const newApplication = {
      ...application,
      id: this.generateId(),
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Submit the job application and also add to appliedJobs collection
    return this.http.post<JobApplication>(this.apiUrl, newApplication).pipe(
      switchMap((submittedApplication) => {
        // Add entry to appliedJobs collection
        return this.appliedJobsService
          .addAppliedJob(
            application.userId,
            application.jobId,
            submittedApplication.id
          )
          .pipe(
            map(() => submittedApplication) // Return the original application
          );
      })
    );
  }

  getUserApplications(userId: string): Observable<JobApplication[]> {
    return this.http.get<JobApplication[]>(`${this.apiUrl}?userId=${userId}`);
  }

  getJobApplications(jobId: string): Observable<JobApplication[]> {
    return this.http.get<JobApplication[]>(`${this.apiUrl}?jobId=${jobId}`);
  }

  getApplicationById(applicationId: string): Observable<JobApplication> {
    return this.http.get<JobApplication>(`${this.apiUrl}/${applicationId}`);
  }

  updateApplicationStatus(
    applicationId: string,
    status: JobApplication['status'],
    notes?: string
  ): Observable<JobApplication> {
    const updates = {
      status,
      updatedAt: new Date().toISOString(),
      ...(notes && { notes }),
    };

    return this.http.patch<JobApplication>(
      `${this.apiUrl}/${applicationId}`,
      updates
    );
  }

  checkIfUserApplied(userId: string, jobId: string): Observable<boolean> {
    return this.http
      .get<JobApplication[]>(`${this.apiUrl}?userId=${userId}&jobId=${jobId}`)
      .pipe(map((applications) => applications.length > 0));
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}
