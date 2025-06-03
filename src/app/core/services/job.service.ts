import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: 'full-time' | 'part-time' | 'contract' | 'remote';
  salary: string;
  description: string;
  requirements: string[];
  benefits: string[];
  postedDate: string;
  applicationDeadline: string;
  companyLogo?: string;
  companyDescription: string;
  contactEmail: string;
  experienceLevel: 'entry' | 'mid' | 'senior' | 'executive';
  skills: string[];
  isActive: boolean;
  applicationCount: number;
  featured?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class JobService {
  private API_URL = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  getAllJobs(): Observable<Job[]> {
    return this.http.get<Job[]>(`${this.API_URL}/jobs`).pipe(
      catchError((error) => {
        console.error('Error fetching jobs:', error);
        throw error;
      })
    );
  }

  getJobById(id: string): Observable<Job | null> {
    return this.http.get<Job>(`${this.API_URL}/jobs/${id}`).pipe(
      map((job) => job || null),
      catchError((error) => {
        console.error('Error fetching job:', error);
        return of(null);
      })
    );
  }

  getFeaturedJobs(): Observable<Job[]> {
    return this.getAllJobs().pipe(
      map((jobs) => jobs.filter((job) => job.featured))
    );
  }

  searchJobs(query: string): Observable<Job[]> {
    return this.getAllJobs().pipe(
      map((jobs) =>
        jobs.filter(
          (job) =>
            job.title.toLowerCase().includes(query.toLowerCase()) ||
            job.company.toLowerCase().includes(query.toLowerCase()) ||
            job.location.toLowerCase().includes(query.toLowerCase()) ||
            job.skills.some((skill) =>
              skill.toLowerCase().includes(query.toLowerCase())
            )
        )
      )
    );
  }

  filterJobs(filters: {
    type?: string;
    location?: string;
    experienceLevel?: string;
    salary?: string;
  }): Observable<Job[]> {
    return this.getAllJobs().pipe(
      map((jobs) => {
        let filteredJobs = [...jobs];

        if (filters.type) {
          filteredJobs = filteredJobs.filter(
            (job) => job.type === filters.type
          );
        }

        if (filters.location) {
          filteredJobs = filteredJobs.filter((job) =>
            job.location.toLowerCase().includes(filters.location!.toLowerCase())
          );
        }

        if (filters.experienceLevel) {
          filteredJobs = filteredJobs.filter(
            (job) => job.experienceLevel === filters.experienceLevel
          );
        }

        return filteredJobs;
      })
    );
  }

  applyForJob(jobId: string, applicationData: any): Observable<boolean> {
    return this.http
      .post<boolean>(`${this.API_URL}/jobs/${jobId}/apply`, applicationData)
      .pipe(
        catchError((error) => {
          console.error('Error applying for job:', error);
          throw error;
        })
      );
  }
}
